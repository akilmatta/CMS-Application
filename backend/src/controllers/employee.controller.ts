import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { parseExcelFile, NormalizedEmployee } from '../utils/parseExcel';
import { 
  calculateExpiryDate, 
  getValidityType, 
  getValidYears,
  hasValidityRule,
  getAllValidityRules,
  getAllCertificationNames
} from '../utils/certificationValidityMap';
import { certificationValidityService } from '../utils/certificationValidityService';

export const uploadExcel = async (req: Request, res: Response) => {
  try {
    console.log('Upload request received');
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received:', req.file.originalname, req.file.size);
    
    const normalizedEmployees = parseExcelFile(req.file.buffer);
    console.log('Parsed employees:', normalizedEmployees);
    
    if (normalizedEmployees.length === 0) {
      console.log('No valid data found in Excel file');
      return res.status(400).json({ error: 'No valid data found in Excel file' });
    }

    // Upsert employees and certifications in the database
    const processedEmployees = [];
    let createdCount = 0;
    let updatedCount = 0;
    
    console.log('Processing employees in database...');
    
    for (const normalizedEmployee of normalizedEmployees) {
      console.log('Processing employee:', normalizedEmployee.employeeName);
      
      // Check if employee already exists
      let employee = await prisma.employee.findFirst({
        where: {
          name: normalizedEmployee.employeeName
        },
        include: {
          certifications: true
        }
      });
      
      if (employee) {
        console.log('Employee exists, updating:', employee.id);
        updatedCount++;
      } else {
        console.log('Creating new employee');
        employee = await prisma.employee.create({
          data: {
            name: normalizedEmployee.employeeName
          },
          include: {
            certifications: true
          }
        });
        createdCount++;
        console.log('Employee created with ID:', employee.id);
      }

      // Parse certifications string and upsert certification records
      const certifications = normalizedEmployee.certifications.split(' | ');
      console.log('Certifications to process:', certifications);
      
      // Track which certifications are being processed
      const processedCertNames = new Set<string>();
      
      for (const certification of certifications) {
        // Extract certification name and date from format "Cert Name (YYYY-MM-DD)"
        const match = certification.match(/^(.+?)\s+\((\d{4}-\d{2}-\d{2})\)$/);
        if (match) {
          const [, certName, expiryDate] = match;
          const trimmedCertName = certName.trim();
          const parsedExpiryDate = new Date(expiryDate);
          
          console.log('Processing certification:', trimmedCertName, 'expires:', expiryDate);
          processedCertNames.add(trimmedCertName);
          
          // Use validity map to determine expiry date and validity type
          const calculatedExpiryDate = calculateExpiryDate(trimmedCertName, parsedExpiryDate);
          const calculatedValidityType = getValidityType(trimmedCertName);
          const calculatedValidYears = getValidYears(trimmedCertName);
          
          // Check if certification already exists for this employee
          const existingCert = employee.certifications.find(
            (cert: any) => cert.name === trimmedCertName
          );
          
          if (existingCert) {
            console.log('Updating existing certification:', existingCert.id);
            await prisma.certification.update({
              where: { id: existingCert.id },
              data: {
                expiryDate: calculatedExpiryDate,
                validityType: calculatedValidityType,
                validYears: calculatedValidYears
              }
            });
          } else {
            console.log('Creating new certification');
            await prisma.certification.create({
              data: {
                employeeId: employee.id,
                name: trimmedCertName,
                expiryDate: calculatedExpiryDate,
                validityType: calculatedValidityType,
                validYears: calculatedValidYears
              }
            });
          }
        }
      }
      
      // Remove certifications that are not in the Excel file
      const certificationsToRemove = employee.certifications.filter(
        (cert: any) => !processedCertNames.has(cert.name)
      );
      
      if (certificationsToRemove.length > 0) {
        console.log('Removing certifications not in Excel:', certificationsToRemove.map((c: any) => c.name));
        for (const certToRemove of certificationsToRemove) {
          await prisma.certification.delete({
            where: { id: certToRemove.id }
          });
        }
      }

      // Get the updated employee with certifications
      const employeeWithCerts = await prisma.employee.findUnique({
        where: { id: employee.id },
        include: {
          certifications: {
            orderBy: { expiryDate: 'asc' }
          }
        }
      });

      processedEmployees.push(employeeWithCerts);
    }
    
    console.log('Total employees processed:', processedEmployees.length);
    console.log('Created:', createdCount, 'Updated:', updatedCount);

    res.json({
      message: `Successfully processed ${processedEmployees.length} employees (${createdCount} created, ${updatedCount} updated)`,
      data: processedEmployees,
      totalEmployees: processedEmployees.length,
      created: createdCount,
      updated: updatedCount
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process Excel file' });
  }
};

export const getEmployees = async (req: Request, res: Response) => {
  try {
    console.log('Fetching employees from database...');
    
    const employees = await prisma.employee.findMany({
      include: {
        certifications: {
          orderBy: { expiryDate: 'asc' }
        }
      }
    });

    console.log('Found employees:', employees.length);
    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Employee name is required' });
    }

    const employee = await prisma.employee.create({
      data: {
        name: name.trim()
      },
      include: {
        certifications: true
      }
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { certifications: true }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await prisma.employee.delete({
      where: { id }
    });

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};

export const addCertification = async (req: Request, res: Response) => {
  try {
    const { employeeId, name, expiryDate, validityType, validYears } = req.body;

    if (!employeeId || !name) {
      return res.status(400).json({ error: 'Employee ID and certification name are required' });
    }

    // Validate employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const trimmedName = name.trim();
    
    // Use validity map to determine expiry date and validity type
    const calculatedExpiryDate = calculateExpiryDate(trimmedName, expiryDate ? new Date(expiryDate) : undefined);
    const calculatedValidityType = getValidityType(trimmedName);
    const calculatedValidYears = getValidYears(trimmedName);

    // Validate custom expiry date if provided
    if (expiryDate && calculatedExpiryDate !== null) {
      const parsedDate = new Date(expiryDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid expiry date format' });
      }
    }

    // Validate validity type if provided
    const validValidityTypes = ['LIFETIME', 'FIXED_YEARS', 'CUSTOM_DATE'];
    if (validityType && !validValidityTypes.includes(validityType)) {
      return res.status(400).json({ error: 'Invalid validity type' });
    }

    // Validate validYears for FIXED_YEARS type
    if (validityType === 'FIXED_YEARS' && (!validYears || validYears < 1 || validYears > 50)) {
      return res.status(400).json({ error: 'Valid years must be between 1 and 50 for FIXED_YEARS type' });
    }

    const certificationData: any = {
      employeeId,
      name: trimmedName,
      expiryDate: calculatedExpiryDate,
      validityType: validityType || calculatedValidityType
    };

    // Add validYears if provided or calculated
    if (validityType === 'FIXED_YEARS' && validYears) {
      certificationData.validYears = validYears;
    } else if (calculatedValidYears) {
      certificationData.validYears = calculatedValidYears;
    }

    const certification = await prisma.certification.create({
      data: certificationData,
      include: {
        employee: true
      }
    });

    res.status(201).json(certification);
  } catch (error) {
    console.error('Add certification error:', error);
    res.status(500).json({ error: 'Failed to add certification' });
  }
};

export const updateCertification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, expiryDate, validityType, validYears } = req.body;

    if (!name && !expiryDate && !validityType && validYears === undefined) {
      return res.status(400).json({ error: 'At least one field (name, expiryDate, validityType, or validYears) is required' });
    }

    // Get current certification to check if name is changing
    const currentCertification = await prisma.certification.findUnique({
      where: { id }
    });

    if (!currentCertification) {
      return res.status(404).json({ error: 'Certification not found' });
    }

    const updateData: any = {};
    
    if (name) {
      const trimmedName = name.trim();
      updateData.name = trimmedName;
      
      // If name is changing, recalculate validity based on new name
      if (trimmedName !== currentCertification.name) {
        const calculatedExpiryDate = calculateExpiryDate(trimmedName, expiryDate ? new Date(expiryDate) : undefined);
        const calculatedValidityType = getValidityType(trimmedName);
        const calculatedValidYears = getValidYears(trimmedName);
        
        updateData.expiryDate = calculatedExpiryDate;
        updateData.validityType = validityType || calculatedValidityType;
        
        if (calculatedValidYears) {
          updateData.validYears = calculatedValidYears;
        }
      }
    }
    
    if (expiryDate && !name) {
      const parsedDate = new Date(expiryDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      updateData.expiryDate = parsedDate;
    }

    if (validityType) {
      // Validate validity type
      const validValidityTypes = ['LIFETIME', 'FIXED_YEARS', 'CUSTOM_DATE'];
      if (!validValidityTypes.includes(validityType)) {
        return res.status(400).json({ error: 'Invalid validity type' });
      }
      updateData.validityType = validityType;
    }

    if (validYears !== undefined) {
      // Validate validYears for FIXED_YEARS type
      if (validityType === 'FIXED_YEARS' && (validYears < 1 || validYears > 50)) {
        return res.status(400).json({ error: 'Valid years must be between 1 and 50 for FIXED_YEARS type' });
      }
      updateData.validYears = validYears;
    }

    const certification = await prisma.certification.update({
      where: { id },
      data: updateData,
      include: {
        employee: true
      }
    });

    res.json(certification);
  } catch (error) {
    console.error('Update certification error:', error);
    res.status(500).json({ error: 'Failed to update certification' });
  }
};

export const deleteCertification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const certification = await prisma.certification.findUnique({
      where: { id }
    });

    if (!certification) {
      return res.status(404).json({ error: 'Certification not found' });
    }

    await prisma.certification.delete({
      where: { id }
    });

    res.json({ message: 'Certification deleted successfully' });
  } catch (error) {
    console.error('Delete certification error:', error);
    res.status(500).json({ error: 'Failed to delete certification' });
  }
};

export const getValidityMap = async (req: Request, res: Response) => {
  try {
    const validityRules = getAllValidityRules();
    const certificationNames = getAllCertificationNames();
    
    res.json({
      validityRules,
      certificationNames,
      totalCertifications: certificationNames.length
    });
  } catch (error) {
    console.error('Get validity map error:', error);
    res.status(500).json({ error: 'Failed to fetch validity map' });
  }
};

export const getValidityStatistics = async (req: Request, res: Response) => {
  try {
    const statistics = await certificationValidityService.getValidityStatistics();
    res.json(statistics);
  } catch (error) {
    console.error('Get validity statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch validity statistics' });
  }
};

export const bulkUpdateEmployeeCertifications = async (req: Request, res: Response) => {
  try {
    const { employeeId, validityType, validYears } = req.body;

    if (!employeeId || !validityType) {
      return res.status(400).json({ error: 'Employee ID and validity type are required' });
    }

    const validValidityTypes = ['LIFETIME', 'FIXED_YEARS', 'CUSTOM_DATE'];
    if (!validValidityTypes.includes(validityType)) {
      return res.status(400).json({ error: 'Invalid validity type' });
    }

    if (validityType === 'FIXED_YEARS' && (!validYears || validYears < 1 || validYears > 50)) {
      return res.status(400).json({ error: 'Valid years must be between 1 and 50 for FIXED_YEARS type' });
    }

    const result = await certificationValidityService.bulkUpdateEmployeeCertifications(
      employeeId, 
      validityType, 
      validYears
    );

    res.json(result);
  } catch (error) {
    console.error('Bulk update employee certifications error:', error);
    res.status(500).json({ error: 'Failed to bulk update employee certifications' });
  }
};

export const bulkUpdateCertificationsByName = async (req: Request, res: Response) => {
  try {
    const { certificationName, validityType, validYears } = req.body;

    if (!certificationName || !validityType) {
      return res.status(400).json({ error: 'Certification name and validity type are required' });
    }

    const validValidityTypes = ['LIFETIME', 'FIXED_YEARS', 'CUSTOM_DATE'];
    if (!validValidityTypes.includes(validityType)) {
      return res.status(400).json({ error: 'Invalid validity type' });
    }

    if (validityType === 'FIXED_YEARS' && (!validYears || validYears < 1 || validYears > 50)) {
      return res.status(400).json({ error: 'Valid years must be between 1 and 50 for FIXED_YEARS type' });
    }

    const result = await certificationValidityService.bulkUpdateCertificationsByName(
      certificationName, 
      validityType, 
      validYears
    );

    res.json(result);
  } catch (error) {
    console.error('Bulk update certifications by name error:', error);
    res.status(500).json({ error: 'Failed to bulk update certifications by name' });
  }
};

export const validateCertificationName = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    if (!name) {
      return res.status(400).json({ error: 'Certification name is required' });
    }

    const validation = certificationValidityService.validateCertificationName(name);
    res.json(validation);
  } catch (error) {
    console.error('Validate certification name error:', error);
    res.status(500).json({ error: 'Failed to validate certification name' });
  }
}; 