import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { parseExcelFile, NormalizedEmployee } from '../utils/parseExcel';

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
          
          // Check if certification already exists for this employee
          const existingCert = employee.certifications.find(
            (cert: any) => cert.name === trimmedCertName
          );
          
          if (existingCert) {
            console.log('Updating existing certification:', existingCert.id);
            await prisma.certification.update({
              where: { id: existingCert.id },
              data: {
                expiryDate: parsedExpiryDate
              }
            });
          } else {
            console.log('Creating new certification');
            await prisma.certification.create({
              data: {
                employeeId: employee.id,
                name: trimmedCertName,
                expiryDate: parsedExpiryDate
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
    const { employeeId, name, expiryDate } = req.body;

    if (!employeeId || !name || !expiryDate) {
      return res.status(400).json({ error: 'Employee ID, certification name, and expiry date are required' });
    }

    // Validate employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Validate date
    const parsedDate = new Date(expiryDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid expiry date format' });
    }

    const certification = await prisma.certification.create({
      data: {
        employeeId,
        name: name.trim(),
        expiryDate: parsedDate
      },
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
    const { name, expiryDate } = req.body;

    if (!name && !expiryDate) {
      return res.status(400).json({ error: 'At least one field (name or expiryDate) is required' });
    }

    const updateData: any = {};
    
    if (name) {
      updateData.name = name.trim();
    }
    
    if (expiryDate) {
      const parsedDate = new Date(expiryDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      updateData.expiryDate = parsedDate;
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