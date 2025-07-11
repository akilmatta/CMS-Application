import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/MainLayout'
import Dashboard from './pages/Dashboard'
import EmployeeManagement from './pages/EmployeeManagement'

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/employees" element={<EmployeeManagement />} />
        <Route path="/sites" element={<div className="p-6">Sites Management - Coming Soon</div>} />
        <Route path="/warehouse" element={<div className="p-6">Warehouse Management - Coming Soon</div>} />
      </Routes>
    </MainLayout>
  )
}

export default App 