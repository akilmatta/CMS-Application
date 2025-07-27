// Firebase Configuration
// Update these values with your actual Firebase project settings

export const firebaseConfig = {
    apiKey: "AIzaSyDJxW_TSZQB20IHWhR95r2eekgE9GX7_DQ",
    authDomain: "cms-application-39018.firebaseapp.com",
    projectId: "cms-application-39018",
    storageBucket: "cms-application-39018.firebasestorage.app",
    messagingSenderId: "52493738566",
    appId: "1:52493738566:web:7935c413f41c49bc68e047",
    measurementId: "G-9Q8QMP12XS"
};

export const firebaseStorageConfig = {
  bucketName: process.env.FIREBASE_STORAGE_BUCKET || "cms-application-39018.firebasestorage.app",
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['.pdf', '.xlsx', '.xls'],
  uploadFolder: 'uploads'
}; 