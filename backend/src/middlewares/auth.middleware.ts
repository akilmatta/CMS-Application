import admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';
import path from 'path';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: any;
}

if (!admin.apps.length) {
  try {
    // Try to use service account key file
    const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    // Try environment variables
    if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      // Fallback to application default credentials
      console.log('Service account key not found, using application default credentials');
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  }
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // contains uid, email, etc.
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}; 