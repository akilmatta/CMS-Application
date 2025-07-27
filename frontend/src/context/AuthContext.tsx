import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '../firebase';
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  User as FirebaseUser,
} from 'firebase/auth';
import axios from 'axios';

interface UserWithRole extends FirebaseUser {
  role?: string;
  employeeId?: string;
}

interface AuthContextType {
  user: UserWithRole | null;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('Firebase user authenticated:', firebaseUser.email);
        // Get Firebase ID token
        const token = await firebaseUser.getIdToken();
        try {
          // Fetch employee profile from backend
          console.log('Fetching employee profile for email:', firebaseUser.email);
          const response = await axios.get('/api/employees/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('Employee profile received:', response.data);
          const { role, id } = response.data;
          console.log('Setting user with role:', role, 'and id:', id);
          setUser({ ...firebaseUser, role, employeeId: id });
        } catch (err: any) {
          console.error('Error fetching employee profile:', err);
          console.error('Error details:', err.response?.data);
          // If not found or error, treat as no user
          setUser(null);
        }
      } else {
        console.log('No Firebase user');
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = async () => {
    try {
      await signOut(auth);
      // Explicitly clear the user state
      setUser(null);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if Firebase logout fails, clear the local state
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}; 