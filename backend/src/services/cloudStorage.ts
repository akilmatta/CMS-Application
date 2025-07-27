import { adminStorage } from '../config/firebase';
import { Request } from 'express';

export interface UploadResult {
  fileUrl: string;
  fileName: string;
  filePath: string;
}

export class CloudStorageService {
  private bucket = adminStorage.bucket();

  /**
   * Upload a file to Firebase Storage
   */
  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<UploadResult> {
    try {
      console.log(`Starting file upload to folder: ${folder}`);
      console.log(`File details: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`);
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1E9);
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${folder}/${timestamp}-${randomSuffix}.${fileExtension}`;

      console.log(`Generated filename: ${fileName}`);

      // Create file reference
      const fileRef = this.bucket.file(fileName);

      // Upload file
      console.log('Uploading file to Firebase Storage...');
      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString()
          }
        }
      });

      console.log('File uploaded successfully, making it public...');

      // Make file publicly accessible
      await fileRef.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;
      
      console.log(`File made public. Public URL: ${publicUrl}`);

      return {
        fileUrl: publicUrl,
        fileName: file.originalname,
        filePath: fileName
      };
    } catch (error: any) {
      console.error('Error uploading file to cloud storage:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw new Error('Failed to upload file to cloud storage');
    }
  }

  /**
   * Delete a file from Firebase Storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fileRef = this.bucket.file(filePath);
      await fileRef.delete();
    } catch (error) {
      console.error('Error deleting file from cloud storage:', error);
      throw new Error('Failed to delete file from cloud storage');
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string) {
    try {
      const fileRef = this.bucket.file(filePath);
      const [metadata] = await fileRef.getMetadata();
      return metadata;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw new Error('Failed to get file metadata');
    }
  }

  /**
   * Generate signed URL for private files (if needed)
   */
  async generateSignedUrl(filePath: string, expirationMinutes: number = 60): Promise<string> {
    try {
      const fileRef = this.bucket.file(filePath);
      const [signedUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + expirationMinutes * 60 * 1000
      });
      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }
}

export const cloudStorageService = new CloudStorageService(); 