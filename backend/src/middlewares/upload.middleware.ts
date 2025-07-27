import multer from 'multer';
import path from 'path';

// Configure multer for file upload - using memory storage for cloud uploads
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file extension
  const allowedExtensions = ['.xlsx', '.xls', '.pdf'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel files (.xlsx, .xls) and PDF files (.pdf) are allowed'));
  }
};

export const uploadMiddleware = multer({
  storage: storage, // Memory storage for cloud uploads
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
}); 