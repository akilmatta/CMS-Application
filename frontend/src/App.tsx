import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import MainLayout from './components/MainLayout'
import EmployeeLayout from './components/EmployeeLayout'
import Dashboard from './pages/Dashboard'
import EmployeeManagement from './pages/EmployeeManagement'
import SiteManagement from './pages/SiteManagement'
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import EmployeeSites from './pages/employee/EmployeeSites'
import EmployeeTasks from './pages/employee/EmployeeTasks'
import EmployeeChecklists from './pages/employee/EmployeeChecklists'
import Login from './pages/Login'
import Register from './pages/Register'
import { useAuth } from './context/AuthContext'

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function App() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'HEAD_OFFICE';
  const isEmployee = user?.role && user.role !== 'HEAD_OFFICE';

  console.log('App render - user:', user);
  console.log('App render - isAdmin:', isAdmin);
  console.log('App render - isEmployee:', isEmployee);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={isAdmin ? "/dashboard" : "/employee/dashboard"} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={isAdmin ? "/dashboard" : "/employee/dashboard"} /> : <Register />} />
      
      {/* Employee Routes */}
      {isEmployee && (
        <Route
          path="/employee/*"
          element={
            <PrivateRoute>
              <EmployeeLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="sites" element={<EmployeeSites />} />
          <Route path="tasks" element={<EmployeeTasks />} />
          <Route path="checklists" element={<EmployeeChecklists />} />
        </Route>
      )}
      
      {/* Admin Routes */}
      {isAdmin && (
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<EmployeeManagement />} />
          <Route path="sites/*" element={<SiteManagement />} />
          {/* Add more protected routes here */}
        </Route>
      )}
      
      {/* Fallback for authenticated users */}
      {user && (
        <Route path="*" element={<Navigate to={isAdmin ? "/dashboard" : "/employee/dashboard"} />} />
      )}
      
      {/* Fallback for unauthenticated users - redirect to login */}
      {!user && (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  )
}

export default App 