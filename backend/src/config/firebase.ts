import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import admin from 'firebase-admin';
import { firebaseConfig, firebaseStorageConfig } from './firebase-config';

// Initialize Firebase for client-side operations
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Initialize Firebase Admin for server-side operations
let adminApp: admin.app.App;

try {
  // Try to initialize with service account
  const serviceAccount = require('../../firebase-service-account.json');
  adminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: firebaseStorageConfig.bucketName
  });
} catch (error) {
  console.log('Service account not found, using default credentials');
  // Fallback to default credentials (for development)
  adminApp = admin.initializeApp({
    storageBucket: firebaseStorageConfig.bucketName
  });
}

export const adminStorage = admin.storage(adminApp);
export const adminAuth = admin.auth(adminApp);

export default adminApp; 