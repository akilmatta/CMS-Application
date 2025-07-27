import { Outlet } from 'react-router-dom'
import EmployeeSidebar from './EmployeeSidebar'

const EmployeeLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <EmployeeSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default EmployeeLayout 