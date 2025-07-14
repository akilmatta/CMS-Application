import { Router } from 'express';
import { 
  uploadExcel, 
  getEmployees, 
  createEmployee,
  deleteEmployee,
  addCertification,
  updateCertification,
  deleteCertification,
  getValidityMap,
  getValidityStatistics,
  bulkUpdateEmployeeCertifications,
  bulkUpdateCertificationsByName,
  validateCertificationName
} from '../controllers/employee.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

// Employee CRUD operations
router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.delete('/employees/:id', deleteEmployee);

// Upload Excel file
router.post('/employees/upload', uploadMiddleware.single('file'), uploadExcel);

// Certification CRUD operations
router.post('/employees/certifications', addCertification);
router.put('/employees/certifications/:id', updateCertification);
router.delete('/employees/certifications/:id', deleteCertification);

// Validity map endpoints
router.get('/validity-map', getValidityMap);
router.get('/validity-statistics', getValidityStatistics);
router.post('/bulk-update-employee-certifications', bulkUpdateEmployeeCertifications);
router.post('/bulk-update-certifications-by-name', bulkUpdateCertificationsByName);
router.get('/validate-certification/:name', validateCertificationName);

export default router; 