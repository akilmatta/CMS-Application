import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { employeeAPI } from '../../services/api'

interface Activity {
  type: 'certification' | 'site_assignment' | 'checklist'
  id: string
  title: string
  description: string
  date: string
  data: any
}

interface ActivityResponse {
  activities: Activity[]
  totalActivities: number
}

const EmployeeDashboard = () => {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.uid) {
      fetchEmployeeActivity()
    }
  }, [user])

  const fetchEmployeeActivity = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use the real employee ID from user context
      if (!user?.employeeId) {
        setError('Employee ID not found')
        setLoading(false)
        return
      }
      
      const response = await employeeAPI.getEmployeeActivity(user.employeeId)
      setActivities(response.activities)
    } catch (err: any) {
      console.error('Error fetching employee activity:', err)
      setError(err.response?.data?.error || err.message || 'Failed to load activity')
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'certification':
        return '📜'
      case 'site_assignment':
        return '🏗️'
      case 'checklist':
        return '✅'
      default:
        return '📝'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading your activity...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error: {error}</div>
        <button 
          onClick={fetchEmployeeActivity}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Your recent activity and updates</p>
      </div>

      {/* Quick Access */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/employee/checklists"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg">📋</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Available Checklists</h3>
              <p className="text-sm text-gray-500">Download and complete checklists</p>
            </div>
            <div className="ml-auto">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
          
          <Link
            to="/employee/tasks"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">My Tasks</h3>
              <p className="text-sm text-gray-500">View and manage your tasks</p>
            </div>
            <div className="ml-auto">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">🏗️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Sites</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activities.filter(a => a.type === 'site_assignment').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-medium">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activities.filter(a => a.type === 'checklist' && a.data?.status === 'COMPLETED').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm font-medium">📜</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Certifications</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activities.filter(a => a.type === 'certification').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity - Moved to bottom */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-sm text-gray-600">
            {activities.length} activities in the last 30 days
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {activities.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <div className="text-gray-500 text-lg mb-2">No recent activity</div>
              <p className="text-gray-400">Your activity will appear here once you start working on sites and tasks.</p>
            </div>
          ) : (
            activities.map((activity, index) => (
              <div key={`${activity.id}-${index}`} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 text-2xl">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default EmployeeDashboard 