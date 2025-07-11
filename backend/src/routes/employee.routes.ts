import { Router } from 'express';
import { 
  uploadExcel, 
  getEmployees, 
  createEmployee,
  deleteEmployee,
  addCertification,
  updateCertification,
  deleteCertification
} from '../controllers/employee.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

// Upload Excel file
router.post('/upload', uploadMiddleware.single('file'), uploadExcel);

// Employee CRUD operations
router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.delete('/employees/:id', deleteEmployee);

// Certification CRUD operations
router.post('/certifications', addCertification);
router.put('/certifications/:id', updateCertification);
router.delete('/certifications/:id', deleteCertification);

export default router; 