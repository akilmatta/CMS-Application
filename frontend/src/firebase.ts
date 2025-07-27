// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDJxW_TSZQB20IHWhR95r2eekgE9GX7_DQ",
  authDomain: "cms-application-39018.firebaseapp.com",
  projectId: "cms-application-39018",
  storageBucket: "cms-application-39018.firebasestorage.app",
  messagingSenderId: "52493738566",
  appId: "1:52493738566:web:7935c413f41c49bc68e047",
  measurementId: "G-9Q8QMP12XS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);