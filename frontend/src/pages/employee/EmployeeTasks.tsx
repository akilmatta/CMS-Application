import { useState, useEffect, useMemo, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { employeeAPI } from '../../services/api'

interface EmployeeTask {
  id: string
  type: string
  status: 'PENDING' | 'COMPLETED'
  site: {
    id: string
    name: string
    location: string
  }
  createdAt: string
  updatedAt: string
  completedAt: string | null
  fileUrl: string | null
}

interface TasksResponse {
  tasks: EmployeeTask[]
  pendingTasks: EmployeeTask[]
  completedTasks: EmployeeTask[]
  totalTasks: number
  pendingCount: number
  completedCount: number
}

const EmployeeTasks = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<EmployeeTask[]>([])
  const [pendingTasks, setPendingTasks] = useState<EmployeeTask[]>([])
  const [completedTasks, setCompletedTasks] = useState<EmployeeTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all')
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'COMPLETED'>('all')
  const [siteFilter, setSiteFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'completedAt' | 'type' | 'site'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // File upload states
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.uid) {
      fetchEmployeeTasks()
    }
  }, [user])

  const fetchEmployeeTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use the real employee ID from user context
      if (!user?.employeeId) {
        setError('Employee ID not found')
        setLoading(false)
        return
      }
      
      const response = await employeeAPI.getEmployeeTasks(user.employeeId)
      setTasks(response.tasks)
      setPendingTasks(response.pendingTasks)
      setCompletedTasks(response.completedTasks)
    } catch (err: any) {
      console.error('Error fetching employee tasks:', err)
      setError(err.response?.data?.error || err.message || 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (taskId: string, file: File) => {
    try {
      setUploadingTaskId(taskId)
      setUploadError(null)
      setUploadSuccess(null) // Clear previous success message
      
      if (!user?.employeeId) {
        setUploadError('Employee ID not found')
        return
      }

      await employeeAPI.uploadEmployeeTaskFile(user.employeeId, taskId, file)
      
      // Refresh tasks after successful upload
      await fetchEmployeeTasks()
      setUploadSuccess(`File uploaded successfully for task ${taskId}!`)
      
    } catch (err: any) {
      console.error('Error uploading file:', err)
      setUploadError(err.response?.data?.error || err.message || 'Failed to upload file')
    } finally {
      setUploadingTaskId(null)
    }
  }

  const handleDownloadFile = (fileUrl: string) => {
    if (fileUrl) {
      // Use the full Firebase URL directly
      window.open(fileUrl, '_blank')
    }
  }

  const triggerFileInput = (taskId: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-task-id', taskId)
      fileInputRef.current.click()
    }
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    const taskId = event.target.getAttribute('data-task-id')
    
    if (file && taskId) {
      handleFileUpload(taskId, file)
    }
    
    // Reset the input
    event.target.value = ''
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

  const getStatusColor = (status: 'PENDING' | 'COMPLETED') => {
    return status === 'PENDING' 
      ? 'bg-yellow-100 text-yellow-800' 
      : 'bg-green-100 text-green-800'
  }

  const getStatusIcon = (status: 'PENDING' | 'COMPLETED') => {
    return status === 'PENDING' ? '⏳' : '✅'
  }

  const getDisplayTasks = () => {
    switch (activeTab) {
      case 'pending':
        return pendingTasks
      case 'completed':
        return completedTasks
      default:
        return tasks
    }
  }

  // Get unique sites for filter dropdown
  const uniqueSites = useMemo(() => {
    const sites = tasks.map(task => task.site.name)
    return ['all', ...Array.from(new Set(sites))]
  }, [tasks])

  // Filter and search logic
  const filteredTasks = useMemo(() => {
    let filtered = getDisplayTasks()

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.site.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    // Site filter
    if (siteFilter !== 'all') {
      filtered = filtered.filter(task => task.site.name === siteFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      filtered = filtered.filter(task => {
        const taskDate = new Date(task.createdAt)
        switch (dateFilter) {
          case 'today':
            return taskDate >= today
          case 'week':
            return taskDate >= weekAgo
          case 'month':
            return taskDate >= monthAgo
          default:
            return true
        }
      })
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case 'completedAt':
          aValue = a.completedAt ? new Date(a.completedAt) : new Date(0)
          bValue = b.completedAt ? new Date(b.completedAt) : new Date(0)
          break
        case 'type':
          aValue = a.type.toLowerCase()
          bValue = b.type.toLowerCase()
          break
        case 'site':
          aValue = a.site.name.toLowerCase()
          bValue = b.site.name.toLowerCase()
          break
        default:
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [tasks, pendingTasks, completedTasks, activeTab, searchTerm, statusFilter, siteFilter, dateFilter, sortBy, sortOrder])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading your tasks...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error: {error}</div>
        <button 
          onClick={fetchEmployeeTasks}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-600 mt-2">All your assigned tasks and their status</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">📋</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm font-medium">⏳</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingTasks.length}</p>
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
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{completedTasks.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending ({pendingTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'completed'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Completed ({completedTasks.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search tasks, sites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Site Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Site</label>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {uniqueSites.map(site => (
                <option key={site} value={site}>
                  {site === 'all' ? 'All Sites' : site}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt">Created Date</option>
              <option value="completedAt">Completed Date</option>
              <option value="type">Task Type</option>
              <option value="site">Site Name</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Order:</label>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setSiteFilter('all')
              setDateFilter('all')
              setSortBy('createdAt')
              setSortOrder('desc')
            }}
            className="px-4 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>

          {/* Results Count */}
          <div className="ml-auto text-sm text-gray-500">
            Showing {filteredTasks.length} of {getDisplayTasks().length} tasks
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow">
        {filteredTasks.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <div className="text-gray-500 text-lg mb-2">
              {activeTab === 'all' && 'No tasks assigned'}
              {activeTab === 'pending' && 'No pending tasks'}
              {activeTab === 'completed' && 'No completed tasks'}
            </div>
            <p className="text-gray-400">
              {activeTab === 'all' && 'You haven\'t been assigned any tasks yet.'}
              {activeTab === 'pending' && 'All your tasks are completed!'}
              {activeTab === 'completed' && 'Complete some tasks to see them here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <div key={task.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-xl">{getStatusIcon(task.status)}</span>
                      <h3 className="text-lg font-medium text-gray-900">
                        {task.type}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                    
                    <div className="ml-8 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Site:</span> {task.site.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Location:</span> {task.site.location}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Created:</span> {formatDate(task.createdAt)}
                      </p>
                      {task.completedAt && (
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Completed:</span> {formatDate(task.completedAt)}
                        </p>
                      )}
                      {task.fileUrl && (
                        <p className="text-sm text-blue-600">
                          <span className="font-medium">📎</span> File uploaded
                        </p>
                      )}
                      {task.completedAt && (
                        <p className="text-sm text-green-600">
                          <span className="font-medium">✅</span> Completed on {formatDate(task.completedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0 flex flex-col space-y-2">
                    {task.status === 'PENDING' && (
                      <button 
                        onClick={() => triggerFileInput(task.id)}
                        disabled={uploadingTaskId === task.id}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingTaskId === task.id ? '⏳ Uploading...' : '📤 Upload File'}
                      </button>
                    )}
                    {task.status === 'COMPLETED' && task.fileUrl && (
                      <button 
                        onClick={() => handleDownloadFile(task.fileUrl!)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        👁️ View File
                      </button>
                    )}
                    {task.status === 'COMPLETED' && !task.fileUrl && (
                      <span className="text-gray-500 text-sm px-4 py-2">
                        No file uploaded
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Upload Error Display */}
      {uploadError && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50 max-w-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
              <p className="text-sm text-red-700 mt-1">{uploadError}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setUploadError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Success Display */}
      {uploadSuccess && (
        <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50 max-w-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Upload Successful</h3>
              <p className="text-sm text-green-700 mt-1">{uploadSuccess}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setUploadSuccess(null)}
                className="text-green-400 hover:text-green-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeTasks 