import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const MainLayout = () => {
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/employees', label: 'Employee Management', icon: '👥' },
    { path: '/sites', label: 'Sites', icon: '🏢' },
    { path: '/warehouse', label: 'Warehouse', icon: '📦' }
  ]
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Get user initial and email
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : '?';
  const userEmail = user?.email || 'Unknown';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col justify-between">
        <div>
          {/* Logo/App Name */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">CMS App</h1>
            {/* User Avatar */}
            <div className="relative group ml-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg cursor-pointer border-2 border-blue-200 shadow-sm transition-transform group-hover:scale-105">
                {userInitial}
              </div>
              {/* Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-10 hidden group-hover:block min-w-max bg-white border border-gray-200 shadow-lg rounded px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                <span className="font-semibold">{userEmail}</span>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="mt-6">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : ''
                  }`
                }
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        {/* Logout Button */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full bg-red-100 text-red-700 py-2 rounded hover:bg-red-200 font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default MainLayout 