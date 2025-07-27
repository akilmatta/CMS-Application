import { useState, useEffect, useRef, useMemo } from 'react'
import { siteAPI, Site, Employee, employeeAPI, Checklist } from '../services/api'
import { checklistPdfAPI } from '../services/api'
import SiteCard from '../components/SiteCard'
import CreateSiteModal from '../components/CreateSiteModal'
import SiteDetailsModal from '../components/SiteDetailsModal'
import EditSiteModal from '../components/EditSiteModal'

// Task details modal
const TaskDetailsModal = ({ task, checklistPdfs, onClose, onTaskUpdate }: { 
  task: Checklist & { siteName: string }, 
  checklistPdfs: { id: string; name: string; fileUrl: string; fileName: string; description?: string; uploadedAt: string }[],
  onClose: () => void,
  onTaskUpdate?: () => void 
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true)
      setUploadError(null)
      
      await employeeAPI.uploadEmployeeTaskFile(task.employeeId, task.id, file)
      
      // Refresh the task data
      if (onTaskUpdate) {
        onTaskUpdate()
      }
      
    } catch (err: any) {
      console.error('Error uploading file:', err)
      setUploadError(err.response?.data?.error || err.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadFile = (fileUrl: string) => {
    if (fileUrl) {
      // Use the full Firebase URL directly
      window.open(fileUrl, '_blank')
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    // Reset the input
    event.target.value = ''
  }

  return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Task Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Task Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Site:</span>
                  <p className="text-gray-900">{task.siteName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Employee:</span>
                  <p className="text-gray-900">{task.employee.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <p className="text-gray-900">{task.type}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    task.status === 'PENDING' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {task.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <p className="text-gray-900">{new Date(task.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Updated:</span>
                  <p className="text-gray-900">{new Date(task.updatedAt).toLocaleString()}</p>
                </div>
                {task.completedAt && (
                  <div>
                    <span className="font-medium text-gray-700">Completed:</span>
                    <p className="text-gray-900">{new Date(task.completedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* File Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">File Management</h3>
              
              {/* Original File */}
              {(() => {
                const originalFile = checklistPdfs.find(pdf => pdf.name === task.type)
                return originalFile ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Original File</h4>
                    <p className="text-sm text-blue-700 mb-2">{originalFile.name}</p>
                    <button
                      onClick={() => handleDownloadFile(originalFile.fileUrl)}
                      className="inline-flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Original
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Original File</h4>
                    <p className="text-sm text-gray-600">No original file found for this task type</p>
                  </div>
                )
              })()}

              {/* Upload Completed File */}
              {task.status === 'PENDING' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Upload Completed File</h4>
                  <button
                    onClick={triggerFileInput}
                    disabled={uploading}
                    className="inline-flex items-center px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload Completed File
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* View Completed File */}
              {task.status === 'COMPLETED' && task.fileUrl && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Completed File</h4>
                  <p className="text-sm text-green-700 mb-2">File uploaded by employee</p>
                  <button
                    onClick={() => handleDownloadFile(task.fileUrl!)}
                    className="inline-flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Completed File
                  </button>
                </div>
              )}
              
              {/* No Completed File */}
              {task.status === 'COMPLETED' && !task.fileUrl && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Completed File</h4>
                  <p className="text-sm text-yellow-700">Task marked as completed but no file was uploaded</p>
                </div>
              )}

              {/* Upload Error */}
              {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{uploadError}</p>
                    </div>
                  </div>
          </div>
        )}
      </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
    </div>
  </div>
)
}

// Checklist upload modal (local state for now)
const AddChecklistModal = ({ onClose, onAdd, uploading }: { onClose: () => void, onAdd: (file: File, name: string, description?: string) => void, uploading: boolean }) => {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Checklist PDF</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form className="p-6 space-y-4" onSubmit={e => { 
          e.preventDefault(); 
          if (file && name.trim()) { 
            onAdd(file, name.trim(), description.trim() || undefined); 
          } else { 
            setError('Please provide a name and PDF file.'); 
          } 
        }}>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Checklist Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" rows={3} placeholder="Enter description..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PDF File *</label>
            <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full" required />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
            <button type="submit" disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {uploading ? 'Uploading...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const SiteManagement = () => {
  const [sites, setSites] = useState<Site[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sites' | 'tasks' | 'checklist'>('dashboard')
  const [selectedTask, setSelectedTask] = useState<(Checklist & { siteName: string }) | null>(null)
  // Checklist PDFs from Firebase Storage
  const [checklistPdfs, setChecklistPdfs] = useState<{ id: string; name: string; fileUrl: string; fileName: string; description?: string; uploadedAt: string }[]>([])
  const [showAddChecklist, setShowAddChecklist] = useState(false)
  const [uploadingChecklist, setUploadingChecklist] = useState(false)
  const [checklistError, setChecklistError] = useState<string | null>(null)

  // Filter and search states for tasks
  const [taskSearchTerm, setTaskSearchTerm] = useState('')
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'PENDING' | 'COMPLETED'>('all')
  const [taskSiteFilter, setTaskSiteFilter] = useState('all')
  const [taskEmployeeFilter, setTaskEmployeeFilter] = useState('all')
  const [taskDateFilter, setTaskDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [taskSortBy, setTaskSortBy] = useState<'createdAt' | 'completedAt' | 'type' | 'site' | 'employee'>('createdAt')
  const [taskSortOrder, setTaskSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [sitesData, employeesData, checklistsData] = await Promise.all([
        siteAPI.getSites(),
        employeeAPI.getEmployees(),
        checklistPdfAPI.getChecklistPdfs()
      ])
      setSites(sitesData)
      setEmployees(employeesData)
      setChecklistPdfs(checklistsData.checklists)
      setError(null)
    } catch (err) {
      setError('Failed to fetch data')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSite = async (name: string, location: string) => {
    try {
      const newSite = await siteAPI.createSite({ name, location })
      setSites(prev => [newSite, ...prev])
      setShowCreateModal(false)
    } catch (err) {
      console.error('Error creating site:', err)
      throw err
    }
  }

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
      return
    }

    try {
      await siteAPI.deleteSite(siteId)
      setSites(prev => prev.filter(site => site.id !== siteId))
    } catch (err) {
      console.error('Error deleting site:', err)
      alert('Failed to delete site')
    }
  }

  const handleSiteClick = (site: Site) => {
    setSelectedSite(site)
    setShowDetailsModal(true)
  }

  const handleEditSite = (site: Site) => {
    setSelectedSite(site)
    setShowEditModal(true)
  }

  const handleSiteUpdate = (updatedSite: Site) => {
    setSites(prev => prev.map(site => site.id === updatedSite.id ? updatedSite : site))
    setSelectedSite(updatedSite)
  }

  // Gather KPIs
  const totalSites = sites.length
  const totalEmployees = employees.length
  const totalTasks = sites.reduce((total, site) => total + site.checklists.length, 0)
  const completedTasks = sites.reduce((total, site) => total + site.checklists.filter(c => c.status === 'COMPLETED').length, 0)
  const pendingTasks = sites.reduce((total, site) => total + site.checklists.filter(c => c.status === 'PENDING').length, 0)

  // Flatten all checklists for the Tasks tab
  const allTasks: (Checklist & { siteName: string })[] = sites.flatMap(site =>
    site.checklists.map(checklist => ({ ...checklist, siteName: site.name }))
  )

  // Filter and search logic for tasks
  const filteredTasks = useMemo(() => {
    let filtered = allTasks

    // Search filter
    if (taskSearchTerm) {
      filtered = filtered.filter(task =>
        task.type.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        task.siteName.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        task.employee.name.toLowerCase().includes(taskSearchTerm.toLowerCase())
      )
    }

    // Status filter
    if (taskStatusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === taskStatusFilter)
    }

    // Site filter
    if (taskSiteFilter !== 'all') {
      filtered = filtered.filter(task => task.siteName === taskSiteFilter)
    }

    // Employee filter
    if (taskEmployeeFilter !== 'all') {
      filtered = filtered.filter(task => task.employee.name === taskEmployeeFilter)
    }

    // Date filter
    if (taskDateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      filtered = filtered.filter(task => {
        const taskDate = new Date(task.createdAt)
        switch (taskDateFilter) {
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

      switch (taskSortBy) {
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
          aValue = a.siteName.toLowerCase()
          bValue = b.siteName.toLowerCase()
          break
        case 'employee':
          aValue = a.employee.name.toLowerCase()
          bValue = b.employee.name.toLowerCase()
          break
        default:
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
      }

      if (taskSortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [allTasks, taskSearchTerm, taskStatusFilter, taskSiteFilter, taskEmployeeFilter, taskDateFilter, taskSortBy, taskSortOrder])

  // Get unique values for filter dropdowns
  const uniqueSites = useMemo(() => {
    const siteNames = allTasks.map(task => task.siteName)
    return ['all', ...Array.from(new Set(siteNames))]
  }, [allTasks])

  const uniqueEmployees = useMemo(() => {
    const employeeNames = allTasks.map(task => task.employee.name)
    return ['all', ...Array.from(new Set(employeeNames))]
  }, [allTasks])

  // Real checklist PDF upload to Firebase Storage
  const handleAddChecklist = async (file: File, name: string, description?: string) => {
    try {
      setUploadingChecklist(true)
      setChecklistError(null)
      
      const result = await checklistPdfAPI.uploadChecklistPdf(file, name, description)
      
      // Add the new checklist to the list
      setChecklistPdfs(prev => [result.checklist, ...prev])
    setShowAddChecklist(false)
      
    } catch (error: any) {
      console.error('Error uploading checklist PDF:', error)
      setChecklistError(error.response?.data?.error || 'Failed to upload checklist PDF')
    } finally {
      setUploadingChecklist(false)
    }
  }

  const refreshTasks = async () => {
    try {
      const [sitesData, employeesData] = await Promise.all([
        siteAPI.getSites(),
        employeeAPI.getEmployees()
      ])
      setSites(sitesData)
      setEmployees(employeesData)
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <button
              onClick={fetchData}
              className="mt-3 text-sm font-medium text-red-800 hover:text-red-600"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Navigation Bar */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'sites' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('sites')}
          >
            Sites
          </button>
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'tasks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'checklist' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('checklist')}
          >
            Checklist
          </button>
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">🏢</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Sites</p>
                <p className="text-2xl font-bold text-blue-900">{totalSites}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Total Employees</p>
                <p className="text-2xl font-bold text-green-900">{totalEmployees}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">📝</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">Total Tasks</p>
                <p className="text-2xl font-bold text-yellow-900">{totalTasks}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Completed Tasks</p>
                <p className="text-2xl font-bold text-purple-900">{completedTasks}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Pending Tasks</p>
                <p className="text-2xl font-bold text-red-900">{pendingTasks}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sites Tab */}
      {activeTab === 'sites' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Sites</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Site
            </button>
          </div>
          {sites.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sites</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new site.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sites.map((site) => (
                <SiteCard
                  key={site.id}
                  site={site}
                  onSiteClick={() => handleSiteClick(site)}
                  onEdit={() => handleEditSite(site)}
                  onDelete={() => handleDeleteSite(site.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">All Tasks</h2>
          
          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search tasks, sites, employees..."
                  value={taskSearchTerm}
                  onChange={(e) => setTaskSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={taskStatusFilter}
                  onChange={(e) => setTaskStatusFilter(e.target.value as any)}
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
                  value={taskSiteFilter}
                  onChange={(e) => setTaskSiteFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {uniqueSites.map(site => (
                    <option key={site} value={site}>
                      {site === 'all' ? 'All Sites' : site}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                <select
                  value={taskEmployeeFilter}
                  onChange={(e) => setTaskEmployeeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {uniqueEmployees.map(employee => (
                    <option key={employee} value={employee}>
                      {employee === 'all' ? 'All Employees' : employee}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={taskDateFilter}
                  onChange={(e) => setTaskDateFilter(e.target.value as any)}
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
                  value={taskSortBy}
                  onChange={(e) => setTaskSortBy(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="createdAt">Created Date</option>
                  <option value="completedAt">Completed Date</option>
                  <option value="type">Task Type</option>
                  <option value="site">Site Name</option>
                  <option value="employee">Employee Name</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Order:</label>
                <button
                  onClick={() => setTaskSortOrder(taskSortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {taskSortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                </button>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setTaskSearchTerm('')
                  setTaskStatusFilter('all')
                  setTaskSiteFilter('all')
                  setTaskEmployeeFilter('all')
                  setTaskDateFilter('all')
                  setTaskSortBy('createdAt')
                  setTaskSortOrder('desc')
                }}
                className="px-4 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>

              {/* Results Count */}
              <div className="ml-auto text-sm text-gray-500">
                Showing {filteredTasks.length} of {allTasks.length} tasks
              </div>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {allTasks.length === 0 ? 'No tasks found.' : 'No tasks match your filters.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedTask(task)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.siteName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.employee.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          task.status === 'PENDING' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.fileUrl ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            📄 Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            📄 None
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.completedAt ? new Date(task.completedAt).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Checklist Tab */}
      {activeTab === 'checklist' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Checklist PDFs</h2>
            <button
              onClick={() => setShowAddChecklist(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Checklist
            </button>
          </div>
          {checklistPdfs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No checklist PDFs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Download</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {checklistPdfs.map((pdf, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pdf.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        <a href={pdf.fileUrl} download className="underline">Download</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateSiteModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateSite}
        />
      )}

      {showDetailsModal && selectedSite && (
        <SiteDetailsModal
          site={selectedSite}
          employees={employees}
          checklistPdfs={checklistPdfs}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedSite(null)
          }}
          onSiteUpdate={handleSiteUpdate}
        />
      )}

      {showEditModal && selectedSite && (
        <EditSiteModal
          site={selectedSite}
          onClose={() => {
            setShowEditModal(false)
            setSelectedSite(null)
          }}
          onUpdate={handleSiteUpdate}
        />
      )}

      {selectedTask && (
        <TaskDetailsModal 
          task={selectedTask} 
          checklistPdfs={checklistPdfs}
          onClose={() => setSelectedTask(null)} 
          onTaskUpdate={refreshTasks} 
        />
      )}

      {showAddChecklist && (
        <AddChecklistModal 
          onClose={() => setShowAddChecklist(false)} 
          onAdd={handleAddChecklist} 
          uploading={uploadingChecklist}
        />
      )}
    </div>
  )
}

export default SiteManagement 