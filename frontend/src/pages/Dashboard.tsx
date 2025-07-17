import { useState, useEffect } from 'react'
import { employeeAPI, validityMapAPI, type Employee, type ValidityStatistics } from '../services/api'

const Dashboard = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [statistics, setStatistics] = useState<ValidityStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch employees and statistics in parallel
      const [employeesData, statisticsData] = await Promise.all([
        employeeAPI.getEmployees(),
        validityMapAPI.getValidityStatistics()
      ])
      
      setEmployees(employeesData)
      setStatistics(statisticsData)
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err)
      setError(err.response?.data?.error || err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Calculate dashboard statistics
  const getDashboardStats = () => {
    const totalEmployees = employees.length
    const totalCertifications = employees.reduce((sum, emp) => sum + emp.certifications.length, 0)
    
    const today = new Date()
    const expiringSoon = employees.reduce((sum, emp) => {
      return sum + emp.certifications.filter(cert => {
        if (!cert.expiryDate) return false // Skip lifetime certifications
        const expiry = new Date(cert.expiryDate)
        const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
      }).length
    }, 0)
    
    const expired = employees.reduce((sum, emp) => {
      return sum + emp.certifications.filter(cert => {
        if (!cert.expiryDate) return false // Skip lifetime certifications
        const expiry = new Date(cert.expiryDate)
        return expiry < today
      }).length
    }, 0)

    return { totalEmployees, totalCertifications, expiringSoon, expired }
  }

  const stats = getDashboardStats()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Error loading dashboard: {error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Employees</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalEmployees}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">📜</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Active Certifications</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalCertifications}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.expiringSoon}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-2xl">❌</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Expired</p>
                <p className="text-2xl font-bold text-red-900">{stats.expired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/employees'}
                className="w-full text-left p-3 bg-white rounded border hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <span className="mr-3">👥</span>
                  <span>Add New Employee</span>
                </div>
              </button>
              <button 
                onClick={() => window.location.href = '/employees'}
                className="w-full text-left p-3 bg-white rounded border hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <span className="mr-3">📜</span>
                  <span>Add Certification</span>
                </div>
              </button>
              <button 
                onClick={() => window.location.href = '/employees'}
                className="w-full text-left p-3 bg-white rounded border hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <span className="mr-3">📊</span>
                  <span>View Reports</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">System Overview</h3>
            <div className="space-y-3">
              {statistics && (
                <>
                  <div className="flex items-center p-3 bg-white rounded">
                    <span className="mr-3 text-purple-600">♾️</span>
                    <span className="text-sm">{statistics.validityTypeBreakdown.lifetime} lifetime certifications</span>
                  </div>
                  <div className="flex items-center p-3 bg-white rounded">
                    <span className="mr-3 text-blue-600">📅</span>
                    <span className="text-sm">{statistics.validityTypeBreakdown.fixedYears} fixed-year certifications</span>
                  </div>
                  <div className="flex items-center p-3 bg-white rounded">
                    <span className="mr-3 text-gray-600">📝</span>
                    <span className="text-sm">{statistics.validityTypeBreakdown.customDate} custom date certifications</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 