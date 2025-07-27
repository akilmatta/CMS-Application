import { Router } from 'express';
import { 
  getEmployees, 
  createEmployee, 
  deleteEmployee, 
  updateEmployeeRole, 
  addCertification, 
  updateCertification, 
  deleteCertification, 
  getValidityMap, 
  getValidityStatistics, 
  bulkUpdateEmployeeCertifications, 
  bulkUpdateCertificationsByName, 
  validateCertificationName,
  uploadExcel,
  getEmployeeActivity,
  getEmployeeSites,
  getEmployeeTasks,
  getEmployeeSiteTasks,
  uploadEmployeeTaskFile
} from '../controllers/employee.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import prisma from '../prisma/client';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: any;
}

// Existing routes
router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.delete('/employees/:id', deleteEmployee);
router.put('/employees/:id/role', updateEmployeeRole);
router.post('/employees/upload', uploadMiddleware.single('file'), uploadExcel);

// Certification routes
router.post('/certifications', addCertification);
router.put('/certifications/:id', updateCertification);
router.delete('/certifications/:id', deleteCertification);

// Validity routes
router.get('/validity-map', getValidityMap);
router.get('/validity-statistics', getValidityStatistics);
router.post('/bulk-update-employee-certifications', bulkUpdateEmployeeCertifications);
router.post('/bulk-update-certifications-by-name', bulkUpdateCertificationsByName);
router.get('/validate-certification/:name', validateCertificationName);

// New employee-specific routes (parameterized routes first)
router.get('/employees/:id/activity', getEmployeeActivity);
router.get('/employees/:id/sites', getEmployeeSites);
router.get('/employees/:id/tasks', getEmployeeTasks);
router.get('/employees/:id/site-tasks/:siteId', getEmployeeSiteTasks);
router.post('/employees/:id/tasks/:taskId/upload', uploadMiddleware.single('file'), uploadEmployeeTaskFile);

// Test endpoint to verify file accessibility
router.get('/test-file-access/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const decodedFilename = decodeURIComponent(filename);
    
    console.log('Testing file access for:', decodedFilename);
    
    if (decodedFilename.startsWith('http')) {
      console.log('Firebase URL detected, redirecting to:', decodedFilename);
      return res.redirect(decodedFilename);
    }
    
    console.log('Local file path:', path.join(__dirname, '../../uploads', decodedFilename));
    return res.json({ 
      message: 'File access test', 
      filename: decodedFilename,
      isFirebaseUrl: decodedFilename.startsWith('http')
    });
    
  } catch (error) {
    console.error('Error testing file access:', error);
    res.status(500).json({ error: 'Failed to test file access' });
  }
});

// File download route - handles both Firebase URLs and local files
router.get('/files/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Decode the filename in case it contains URL-encoded characters
    const decodedFilename = decodeURIComponent(filename);
    
    // If the filename is a full URL (cloud storage), redirect to it
    if (decodedFilename.startsWith('http')) {
      return res.redirect(decodedFilename);
    }
    
    // For backward compatibility with local files (if any)
    const filePath = path.join(__dirname, '../../uploads', decodedFilename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${decodedFilename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Specific routes (after parameterized routes to avoid conflicts)
router.get('/employees/me', authenticate, async (req: AuthenticatedRequest, res) => {
  const email = req.user?.email;
  if (!email) return res.status(401).json({ error: 'Unauthorized' });

  const employee = await prisma.employee.findUnique({ where: { email } });
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  res.json({ id: employee.id, name: employee.name, email: employee.email, role: employee.role });
});

router.post('/employees/register', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, role } = req.body;
    const email = req.user?.email;
    const firebaseUid = req.user?.uid;

    if (!email || !firebaseUid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Employee name is required' });
    }

    // Only allow certain roles to be self-registered (not HEAD_OFFICE)
    const allowedRoles = ['FOREMAN', 'SUPERVISOR', 'HSE', 'ELECTRICAL'];
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Cannot self-register with this role' });
    }

    // Check if employee already exists
    const existingEmployee = await prisma.employee.findUnique({ where: { email } });
    if (existingEmployee) {
      return res.status(409).json({ error: 'Employee with this email already exists' });
    }

    // Create the employee record
    const employee = await prisma.employee.create({
      data: {
        name: name.trim(),
        email: email,
        role: role,
        firebaseUid: firebaseUid
      },
      include: {
        certifications: true
      }
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Employee registration error:', error);
    res.status(500).json({ error: 'Failed to register employee' });
  }
});

export default router; 