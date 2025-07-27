import { Router } from 'express';
import { 
  getAllSites, 
  createSite, 
  deleteSite, 
  updateSite,
  getSiteById,
  assignEmployeeToSite,
  removeEmployeeFromSite,
  createChecklist,
  getSiteChecklists,
  updateChecklistStatus,
  uploadChecklistPdf,
  getChecklistPdfs,
  deleteChecklistPdf
} from '../controllers/site.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

// Site routes
router.get('/sites', getAllSites);
router.post('/sites', createSite);
router.get('/sites/:id', getSiteById);
router.put('/sites/:id', updateSite);
router.delete('/sites/:id', deleteSite);

// Employee assignment routes
router.post('/sites/:id/employees', assignEmployeeToSite);
router.delete('/sites/:id/employees/:employeeId', removeEmployeeFromSite);

// Checklist management routes
router.post('/sites/:id/checklists', createChecklist);
router.get('/sites/:id/checklists', getSiteChecklists);

// Checklist status update
router.put('/checklists/:id', updateChecklistStatus);

// Checklist PDF routes
router.post('/checklist-pdfs', uploadMiddleware.single('file'), uploadChecklistPdf);
router.get('/checklist-pdfs', getChecklistPdfs);
router.delete('/checklist-pdfs/:id', deleteChecklistPdf);

export default router; 