import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { cloudStorageService } from '../services/cloudStorage';

// GET /api/sites - Return a list of all sites
export const getAllSites = async (req: Request, res: Response) => {
  try {
    const sites = await prisma.site.findMany({
      include: {
        employees: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        },
        checklists: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(sites);
  } catch (error) {
    console.error('Get all sites error:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
};

// POST /api/sites - Create a new site
export const createSite = async (req: Request, res: Response) => {
  try {
    const { name, location } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Site name is required' });
    }

    if (!location || typeof location !== 'string' || location.trim() === '') {
      return res.status(400).json({ error: 'Site location is required' });
    }

    const site = await prisma.site.create({
      data: {
        name: name.trim(),
        location: location.trim()
      },
      include: {
        employees: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        },
        checklists: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(site);
  } catch (error) {
    console.error('Create site error:', error);
    res.status(500).json({ error: 'Failed to create site' });
  }
};

// GET /api/sites/:id - Return details of a specific site
export const getSiteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        employees: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        },
        checklists: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    res.json(site);
  } catch (error) {
    console.error('Get site by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch site' });
  }
};

// POST /api/sites/:id/employees - Assign an employee to a site
export const assignEmployeeToSite = async (req: Request, res: Response) => {
  try {
    const { id: siteId } = req.params;
    const { employeeId } = req.body;

    if (!employeeId || typeof employeeId !== 'string') {
      return res.status(400).json({ error: 'Employee ID is required' });
    }

    // Check if site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if employee is already assigned to this site
    const existingAssignment = await prisma.siteEmployee.findFirst({
      where: {
        siteId,
        employeeId
      }
    });

    if (existingAssignment) {
      return res.status(400).json({ error: 'Employee is already assigned to this site' });
    }

    // Create the assignment
    const siteEmployee = await prisma.siteEmployee.create({
      data: {
        siteId,
        employeeId
      },
      include: {
        site: true,
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.status(201).json(siteEmployee);
  } catch (error) {
    console.error('Assign employee to site error:', error);
    res.status(500).json({ error: 'Failed to assign employee to site' });
  }
};

// POST /api/sites/:id/checklists - Create a new checklist for a site
export const createChecklist = async (req: Request, res: Response) => {
  try {
    const { id: siteId } = req.params;
    const { employeeId, type } = req.body;

    if (!employeeId || typeof employeeId !== 'string') {
      return res.status(400).json({ error: 'Employee ID is required' });
    }

    if (!type || typeof type !== 'string' || type.trim() === '') {
      return res.status(400).json({ error: 'Checklist type is required' });
    }

    // Check if site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if employee is assigned to this site
    const siteEmployee = await prisma.siteEmployee.findFirst({
      where: {
        siteId,
        employeeId
      }
    });

    if (!siteEmployee) {
      return res.status(400).json({ error: 'Employee is not assigned to this site' });
    }

    // Create the checklist
    const checklist = await prisma.checklist.create({
      data: {
        siteId,
        employeeId,
        type: type.trim()
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
            email: true,
            role: true
          }
        }
      }
    });

    res.status(201).json(checklist);
  } catch (error) {
    console.error('Create checklist error:', error);
    res.status(500).json({ error: 'Failed to create checklist' });
  }
};

// GET /api/sites/:id/checklists - Return all checklists for a site
export const getSiteChecklists = async (req: Request, res: Response) => {
  try {
    const { id: siteId } = req.params;

    // Check if site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const checklists = await prisma.checklist.findMany({
      where: { siteId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(checklists);
  } catch (error) {
    console.error('Get site checklists error:', error);
    res.status(500).json({ error: 'Failed to fetch site checklists' });
  }
};

// Additional utility endpoints

// DELETE /api/sites/:id/employees/:employeeId - Remove employee from site
export const removeEmployeeFromSite = async (req: Request, res: Response) => {
  try {
    const { id: siteId, employeeId } = req.params;

    const siteEmployee = await prisma.siteEmployee.findFirst({
      where: {
        siteId,
        employeeId
      }
    });

    if (!siteEmployee) {
      return res.status(404).json({ error: 'Employee assignment not found' });
    }

    await prisma.siteEmployee.delete({
      where: { id: siteEmployee.id }
    });

    res.json({ message: 'Employee removed from site successfully' });
  } catch (error) {
    console.error('Remove employee from site error:', error);
    res.status(500).json({ error: 'Failed to remove employee from site' });
  }
};

// PUT /api/checklists/:id - Update checklist status
export const updateChecklistStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, fileUrl } = req.body;

    if (!status || !['PENDING', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (PENDING or COMPLETED) is required' });
    }

    const updateData: any = {
      status
    };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }

    if (fileUrl !== undefined) {
      updateData.fileUrl = fileUrl;
    }

    const checklist = await prisma.checklist.update({
      where: { id },
      data: updateData,
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
            email: true,
            role: true
          }
        }
      }
    });

    res.json(checklist);
  } catch (error) {
    console.error('Update checklist status error:', error);
    res.status(500).json({ error: 'Failed to update checklist status' });
  }
};

// PUT /api/sites/:id - Update a site
export const updateSite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Site name is required' });
    }

    if (!location || typeof location !== 'string' || location.trim() === '') {
      return res.status(400).json({ error: 'Site location is required' });
    }

    const site = await prisma.site.findUnique({
      where: { id }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const updatedSite = await prisma.site.update({
      where: { id },
      data: {
        name: name.trim(),
        location: location.trim()
      },
      include: {
        employees: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        },
        checklists: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.json(updatedSite);
  } catch (error) {
    console.error('Update site error:', error);
    res.status(500).json({ error: 'Failed to update site' });
  }
};

// DELETE /api/sites/:id - Delete a site
export const deleteSite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        employees: true,
        checklists: true
      }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Delete the site (cascading will handle related records)
    await prisma.site.delete({
      where: { id }
    });

    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Delete site error:', error);
    res.status(500).json({ error: 'Failed to delete site' });
  }
};

export const uploadChecklistPdf = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    // Upload to Firebase Storage
    const uploadResult = await cloudStorageService.uploadFile(req.file, 'checklist-pdfs');

    // Create checklist record in database
    const checklist = await prisma.checklistPdf.create({
      data: {
        name: req.body.name || req.file.originalname,
        fileUrl: uploadResult.fileUrl,
        filePath: uploadResult.filePath,
        fileName: uploadResult.fileName,
        uploadedBy: req.body.uploadedBy || 'admin',
        description: req.body.description || ''
      }
    });

    res.json({
      message: 'Checklist PDF uploaded successfully',
      checklist: {
        id: checklist.id,
        name: checklist.name,
        fileUrl: checklist.fileUrl,
        fileName: checklist.fileName,
        uploadedAt: checklist.createdAt
      }
    });

  } catch (error: any) {
    console.error('Error uploading checklist PDF:', error);
    res.status(500).json({ error: 'Failed to upload checklist PDF' });
  }
};

export const getChecklistPdfs = async (req: Request, res: Response) => {
  try {
    const checklists = await prisma.checklistPdf.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      checklists: checklists.map(checklist => ({
        id: checklist.id,
        name: checklist.name,
        fileUrl: checklist.fileUrl,
        fileName: checklist.fileName,
        description: checklist.description,
        uploadedBy: checklist.uploadedBy,
        uploadedAt: checklist.createdAt
      }))
    });

  } catch (error: any) {
    console.error('Error fetching checklist PDFs:', error);
    res.status(500).json({ error: 'Failed to fetch checklist PDFs' });
  }
};

export const deleteChecklistPdf = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get the checklist to find the file path
    const checklist = await prisma.checklistPdf.findUnique({
      where: { id }
    });

    if (!checklist) {
      return res.status(404).json({ error: 'Checklist PDF not found' });
    }

    // Delete from Firebase Storage
    if (checklist.filePath) {
      await cloudStorageService.deleteFile(checklist.filePath);
    }

    // Delete from database
    await prisma.checklistPdf.delete({
      where: { id }
    });

    res.json({ message: 'Checklist PDF deleted successfully' });

  } catch (error: any) {
    console.error('Error deleting checklist PDF:', error);
    res.status(500).json({ error: 'Failed to delete checklist PDF' });
  }
}; 