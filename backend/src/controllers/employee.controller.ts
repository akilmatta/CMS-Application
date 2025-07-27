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
import * as XLSX from 'xlsx';
import { cloudStorageService } from '../services/cloudStorage';

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
            name: normalizedEmployee.employeeName,
            email: `${normalizedEmployee.employeeName.toLowerCase().replace(/\s+/g, '.')}@company.com`,
            role: 'FOREMAN',
            firebaseUid: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
    res.status(500).json({ 
      error: 'Failed to fetch employees',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const { name, email, role } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Employee name is required' });
    }

    // Generate default values for required fields if not provided
    const employeeEmail = email || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@company.com`;
    const employeeRole = role || 'FOREMAN';
    const firebaseUid = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const employee = await prisma.employee.create({
      data: {
        name: name.trim(),
        email: employeeEmail,
        role: employeeRole,
        firebaseUid: firebaseUid
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

export const updateEmployeeRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['HEAD_OFFICE', 'SUPERVISOR', 'FOREMAN', 'HSE', 'ELECTRICAL'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' });
    }

    const employee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: { role },
      include: {
        certifications: true
      }
    });

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Update employee role error:', error);
    res.status(500).json({ error: 'Failed to update employee role' });
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
    let shouldRecalculateExpiry = false;
    let newCertificationName = currentCertification.name;
    
    if (name) {
      const trimmedName = name.trim();
      updateData.name = trimmedName;
      newCertificationName = trimmedName;
      
      // If name is changing, we need to recalculate
      if (trimmedName !== currentCertification.name) {
        shouldRecalculateExpiry = true;
      }
    }

    if (validityType) {
      // Validate validity type
      const validValidityTypes = ['LIFETIME', 'FIXED_YEARS', 'CUSTOM_DATE'];
      if (!validValidityTypes.includes(validityType)) {
        return res.status(400).json({ error: 'Invalid validity type' });
      }
      updateData.validityType = validityType;
      
      // If validity type is changing, we need to recalculate expiry date
      if (validityType !== currentCertification.validityType) {
        shouldRecalculateExpiry = true;
      }
    }

    if (validYears !== undefined) {
      // Validate validYears for FIXED_YEARS type
      if (validityType === 'FIXED_YEARS' && (validYears < 1 || validYears > 50)) {
        return res.status(400).json({ error: 'Valid years must be between 1 and 50 for FIXED_YEARS type' });
      }
      updateData.validYears = validYears;
      
      // If valid years is changing for FIXED_YEARS type, we need to recalculate
      if (validYears !== currentCertification.validYears && 
          (validityType === 'FIXED_YEARS' || currentCertification.validityType === 'FIXED_YEARS')) {
        shouldRecalculateExpiry = true;
      }
    }

    // Recalculate expiry date if needed
    if (shouldRecalculateExpiry) {
      const finalValidityType = validityType || currentCertification.validityType;
      const finalValidYears = validYears !== undefined ? validYears : currentCertification.validYears;
      
      if (finalValidityType === 'LIFETIME') {
        updateData.expiryDate = null;
      } else if (finalValidityType === 'FIXED_YEARS' && finalValidYears) {
        // Calculate from current date for FIXED_YEARS
        const currentDate = new Date();
        const calculatedExpiryDate = new Date(currentDate);
        calculatedExpiryDate.setFullYear(currentDate.getFullYear() + finalValidYears);
        updateData.expiryDate = calculatedExpiryDate;
      } else if (finalValidityType === 'CUSTOM_DATE') {
        // For CUSTOM_DATE, use the provided expiry date or keep existing
        if (expiryDate) {
          const parsedDate = new Date(expiryDate);
          if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
          }
          updateData.expiryDate = parsedDate;
        }
        // If no expiry date provided, keep the existing one
      } else {
        // Fallback: try to calculate based on certification name
        const calculatedExpiryDate = calculateExpiryDate(newCertificationName, expiryDate ? new Date(expiryDate) : undefined);
        updateData.expiryDate = calculatedExpiryDate;
      }
    } else if (expiryDate && !name) {
      // Only update expiry date directly if no recalculation is needed
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

// New employee-specific endpoints
export const getEmployeeActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // TODO: Add authentication check to ensure user can only access their own data
    // const currentUserId = req.user?.id;
    // if (currentUserId !== id && req.user?.role !== 'ADMIN') {
    //   return res.status(403).json({ error: 'Access denied' });
    // }

    // Get recent activity for the employee
    const recentActivity = await prisma.$transaction([
      // Recent certifications
      prisma.certification.findMany({
        where: { employeeId: id },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          updatedAt: true,
          expiryDate: true,
          validityType: true
        }
      }),
      // Recent site assignments
      prisma.siteEmployee.findMany({
        where: { employeeId: id },
        orderBy: { assignedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          assignedAt: true,
          site: {
            select: {
              id: true,
              name: true,
              location: true
            }
          }
        }
      }),
      // Recent checklists
      prisma.checklist.findMany({
        where: { employeeId: id },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          status: true,
          updatedAt: true,
          completedAt: true,
          site: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    ]);

    const [certifications, siteAssignments, checklists] = recentActivity;

    // Combine and sort all activities by date
    const allActivities = [
      ...certifications.map((cert: any) => ({
        type: 'certification',
        id: cert.id,
        title: `Certification ${cert.name} updated`,
        description: `Certification ${cert.name} was updated`,
        date: cert.updatedAt,
        data: cert
      })),
      ...siteAssignments.map((assignment: any) => ({
        type: 'site_assignment',
        id: assignment.id,
        title: `Assigned to ${assignment.site.name}`,
        description: `Assigned to site: ${assignment.site.location}`,
        date: assignment.assignedAt,
        data: assignment
      })),
      ...checklists.map((checklist: any) => ({
        type: 'checklist',
        id: checklist.id,
        title: `Checklist ${checklist.type} ${checklist.status.toLowerCase()}`,
        description: `Checklist for ${checklist.site.name} was ${checklist.status.toLowerCase()}`,
        date: checklist.updatedAt,
        data: checklist
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      activities: allActivities.slice(0, 20), // Return last 20 activities
      totalActivities: allActivities.length
    });
  } catch (error) {
    console.error('Get employee activity error:', error);
    res.status(500).json({ error: 'Failed to fetch employee activity' });
  }
};

export const getEmployeeSites = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // TODO: Add authentication check to ensure user can only access their own data
    // const currentUserId = req.user?.id;
    // if (currentUserId !== id && req.user?.role !== 'ADMIN') {
    //   return res.status(403).json({ error: 'Access denied' });
    // }

    // Get all sites assigned to the employee with task counts
    const sitesWithTasks = await prisma.siteEmployee.findMany({
      where: { employeeId: id },
      include: {
        site: {
          include: {
            checklists: {
              where: { employeeId: id },
              select: {
                id: true,
                status: true
              }
            }
          }
        }
      }
    });

    const sitesData = sitesWithTasks.map(siteEmployee => {
      const checklists = siteEmployee.site.checklists;
      const pendingTasks = checklists.filter(c => c.status === 'PENDING').length;
      const completedTasks = checklists.filter(c => c.status === 'COMPLETED').length;
      
      return {
        id: siteEmployee.site.id,
        name: siteEmployee.site.name,
        location: siteEmployee.site.location,
        assignedAt: siteEmployee.assignedAt,
        taskCounts: {
          total: checklists.length,
          pending: pendingTasks,
          completed: completedTasks
        }
      };
    });

    res.json({
      sites: sitesData,
      totalSites: sitesData.length,
      totalTasks: sitesData.reduce((sum, site) => sum + site.taskCounts.total, 0)
    });
  } catch (error) {
    console.error('Get employee sites error:', error);
    res.status(500).json({ error: 'Failed to fetch employee sites' });
  }
};

export const getEmployeeTasks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // TODO: Add authentication check to ensure user can only access their own data
    // const currentUserId = req.user?.id;
    // if (currentUserId !== id && req.user?.role !== 'ADMIN') {
    //   return res.status(403).json({ error: 'Access denied' });
    // }

    // Get all tasks (checklists) for the employee
    const tasks = await prisma.checklist.findMany({
      where: { employeeId: id },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const tasksData = tasks.map(task => ({
      id: task.id,
      type: task.type,
      status: task.status,
      site: task.site,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt,
      fileUrl: task.fileUrl
    }));

    const pendingTasks = tasksData.filter(task => task.status === 'PENDING');
    const completedTasks = tasksData.filter(task => task.status === 'COMPLETED');

    res.json({
      tasks: tasksData,
      pendingTasks,
      completedTasks,
      totalTasks: tasksData.length,
      pendingCount: pendingTasks.length,
      completedCount: completedTasks.length
    });
  } catch (error) {
    console.error('Get employee tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch employee tasks' });
  }
}; 

export const getEmployeeSiteTasks = async (req: Request, res: Response) => {
  try {
    const { id: employeeId, siteId } = req.params;
    console.log('getEmployeeSiteTasks called with params:', req.params);
    console.log('employeeId:', employeeId, 'siteId:', siteId);

    // Validate employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Validate site exists and employee is assigned to it
    const siteEmployee = await prisma.siteEmployee.findFirst({
      where: {
        siteId: siteId,
        employeeId: employeeId
      },
      include: {
        site: true
      }
    });

    if (!siteEmployee) {
      return res.status(404).json({ error: 'Site not found or employee not assigned to this site' });
    }

    // Get all checklists/tasks for this employee at this site
    const tasks = await prisma.checklist.findMany({
      where: {
        employeeId: employeeId,
        siteId: siteId
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
        employee: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Calculate task statistics
    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter((task: any) => task.status === 'PENDING').length;
    const completedTasks = tasks.filter((task: any) => task.status === 'COMPLETED').length;

    res.json({
      site: siteEmployee.site,
      tasks,
      statistics: {
        total: totalTasks,
        pending: pendingTasks,
        completed: completedTasks
      }
    });

  } catch (error: any) {
    console.error('Error fetching employee site tasks:', error);
    res.status(500).json({ error: 'Failed to fetch site tasks' });
  }
}; 

export const uploadEmployeeTaskFile = async (req: Request, res: Response) => {
  try {
    const { id: employeeId, taskId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Validate task exists and belongs to this employee
    const task = await prisma.checklist.findFirst({
      where: {
        id: taskId,
        employeeId: employeeId
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    // Upload the file to cloud storage
    console.log('Uploading employee task file...');
    const uploadResult = await cloudStorageService.uploadFile(req.file, 'task-files');
    console.log('File uploaded successfully:', uploadResult.fileUrl);

    // Update the task with the uploaded file
    const updatedTask = await prisma.checklist.update({
      where: { id: taskId },
      data: {
        fileUrl: uploadResult.fileUrl, // Store the cloud storage URL
        status: 'COMPLETED',
        completedAt: new Date()
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
        employee: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    console.log('Task updated with file URL:', updatedTask.fileUrl);

    res.json({
      message: 'File uploaded successfully',
      task: updatedTask,
      fileUrl: uploadResult.fileUrl
    });

  } catch (error: any) {
    console.error('Error uploading employee task file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
}; 