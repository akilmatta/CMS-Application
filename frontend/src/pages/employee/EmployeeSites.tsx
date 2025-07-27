import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { employeeAPI } from '../../services/api'

interface EmployeeSite {
  id: string
  name: string
  location: string
  assignedAt: string
  taskCounts: {
    total: number
    pending: number
    completed: number
  }
}

interface SitesResponse {
  sites: EmployeeSite[]
  totalSites: number
  totalTasks: number
}

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

interface SiteTasksData {
  site: {
    id: string
    name: string
    location: string
  }
  tasks: EmployeeTask[]
  statistics: {
    total: number
    pending: number
    completed: number
  }
}

const EmployeeSites = () => {
  const { user } = useAuth()
  const [sites, setSites] = useState<EmployeeSite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalTasks, setTotalTasks] = useState(0)
  
  // Modal state
  const [selectedSite, setSelectedSite] = useState<EmployeeSite | null>(null)
  const [siteTasks, setSiteTasks] = useState<SiteTasksData | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  
  // File upload state
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.uid) {
      fetchEmployeeSites()
    }
  }, [user])

  const fetchEmployeeSites = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use the real employee ID from user context
      if (!user?.employeeId) {
        setError('Employee ID not found')
        setLoading(false)
        return
      }
      
      const response = await employeeAPI.getEmployeeSites(user.employeeId)
      setSites(response.sites)
      setTotalTasks(response.totalTasks)
    } catch (err: any) {
      console.error('Error fetching employee sites:', err)
      setError(err.response?.data?.error || err.message || 'Failed to load sites')
    } finally {
      setLoading(false)
    }
  }

  const handleViewTasks = async (site: EmployeeSite) => {
    try {
      setSelectedSite(site)
      setModalLoading(true)
      setModalError(null)
      
      if (!user?.employeeId) {
        setModalError('Employee ID not found')
        setModalLoading(false)
        return
      }
      
      const response = await employeeAPI.getEmployeeSiteTasks(user.employeeId, site.id)
      setSiteTasks(response)
    } catch (err: any) {
      console.error('Error fetching site tasks:', err)
      setModalError(err.response?.data?.error || err.message || 'Failed to load tasks')
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => {
    setSelectedSite(null)
    setSiteTasks(null)
    setModalError(null)
    setUploadError(null)
  }

  const handleFileUpload = async (taskId: string, file: File) => {
    if (!user?.employeeId) {
      setUploadError('Employee ID not found')
      return
    }

    try {
      setUploadingTaskId(taskId)
      setUploadError(null)
      
      await employeeAPI.uploadEmployeeTaskFile(user.employeeId, taskId, file)
      
      // Refresh the tasks to show updated status
      if (selectedSite) {
        await handleViewTasks(selectedSite)
      }
      
    } catch (err: any) {
      console.error('Error uploading file:', err)
      setUploadError(err.response?.data?.error || err.message || 'Failed to upload file')
    } finally {
      setUploadingTaskId(null)
    }
  }

  const handleDownloadFile = (fileUrl: string) => {
    if (fileUrl) {
      const filename = fileUrl.split('/').pop()
      if (filename) {
        const downloadUrl = employeeAPI.downloadFile(filename)
        window.open(downloadUrl, '_blank')
      }
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
      day: 'numeric'
    })
  }

  const getTaskStatusColor = (status: 'pending' | 'completed') => {
    return status === 'pending' 
      ? 'bg-yellow-100 text-yellow-800' 
      : 'bg-green-100 text-green-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading your sites...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error: {error}</div>
        <button 
          onClick={fetchEmployeeSites}
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
        <h1 className="text-3xl font-bold text-gray-900">My Sites</h1>
        <p className="text-gray-600 mt-2">Sites you're currently working on</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">🏗️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Sites</p>
              <p className="text-2xl font-semibold text-gray-900">{sites.length}</p>
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
              <p className="text-sm font-medium text-gray-500">Pending Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">
                {sites.reduce((sum, site) => sum + site.taskCounts.pending, 0)}
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
                {sites.reduce((sum, site) => sum + site.taskCounts.completed, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sites Grid */}
      {sites.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-500 text-lg mb-2">No sites assigned</div>
          <p className="text-gray-400">You haven't been assigned to any sites yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <div key={site.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {site.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      📍 {site.location}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    Assigned {formatDate(site.assignedAt)}
                  </div>
                </div>

                {/* Task Counts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Tasks:</span>
                    <span className="font-medium text-gray-900">{site.taskCounts.total}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Pending:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor('pending')}`}>
                      {site.taskCounts.pending}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Completed:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor('completed')}`}>
                      {site.taskCounts.completed}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {site.taskCounts.total > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((site.taskCounts.completed / site.taskCounts.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(site.taskCounts.completed / site.taskCounts.total) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button 
                  onClick={() => handleViewTasks(site)}
                  className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  View Tasks
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Site Tasks Modal */}
      {selectedSite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Tasks for {selectedSite.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  📍 {selectedSite.location}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {modalLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-lg text-gray-600">Loading tasks...</div>
                </div>
              ) : modalError ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-red-800">Error: {modalError}</div>
                  <button 
                    onClick={() => handleViewTasks(selectedSite)}
                    className="mt-2 text-red-600 hover:text-red-800 underline"
                  >
                    Try again
                  </button>
                </div>
              ) : siteTasks ? (
                <div>
                  {/* Task Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-blue-600">Total Tasks</div>
                      <div className="text-2xl font-semibold text-blue-900">{siteTasks.statistics.total}</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-yellow-600">Pending</div>
                      <div className="text-2xl font-semibold text-yellow-900">{siteTasks.statistics.pending}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-green-600">Completed</div>
                      <div className="text-2xl font-semibold text-green-900">{siteTasks.statistics.completed}</div>
                    </div>
                  </div>

                  {/* Tasks List */}
                  {siteTasks.tasks.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500 text-lg mb-2">No tasks found</div>
                      <p className="text-gray-400">No tasks have been assigned to you for this site yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {siteTasks.tasks.map((task) => (
                        <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium text-gray-900">
                                  {task.type} Checklist
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  task.status === 'PENDING' 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {task.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div>Created: {formatDate(task.createdAt)}</div>
                                <div>Updated: {formatDate(task.updatedAt)}</div>
                                {task.completedAt && (
                                  <div>Completed: {formatDate(task.completedAt)}</div>
                                )}
                              </div>
                              
                              {/* File Actions */}
                              <div className="mt-3 flex flex-wrap gap-2">
                                {/* Download Original File */}
                                {task.fileUrl && (
                                  <button
                                    onClick={() => handleDownloadFile(task.fileUrl!)}
                                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                  >
                                    📥 Download Original
                                  </button>
                                )}
                                
                                {/* Upload Completed File */}
                                {task.status === 'PENDING' && (
                                  <button
                                    onClick={() => triggerFileInput(task.id)}
                                    disabled={uploadingTaskId === task.id}
                                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50"
                                  >
                                    {uploadingTaskId === task.id ? '⏳ Uploading...' : '📤 Upload Completed'}
                                  </button>
                                )}
                                
                                {/* View Uploaded File */}
                                {task.status === 'COMPLETED' && task.fileUrl && (
                                  <button
                                    onClick={() => handleDownloadFile(task.fileUrl!)}
                                    className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                                  >
                                    👁️ View Completed
                                  </button>
                                )}
                              </div>
                              
                              {/* Upload Error */}
                              {uploadError && uploadingTaskId === task.id && (
                                <div className="mt-2 text-xs text-red-600">
                                  {uploadError}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default EmployeeSites 