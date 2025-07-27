import { useState } from 'react'
import { siteAPI, Site, Employee, Checklist } from '../services/api'
import { getChecklistStatusColor, formatDateTime, getRoleColor } from '../services/api'
import { employeeAPI } from '../services/api'

interface SiteDetailsModalProps {
  site: Site
  employees: Employee[]
  checklistPdfs: { id: string; name: string; fileUrl: string; fileName: string; description?: string; uploadedAt: string }[]
  onClose: () => void
  onSiteUpdate: (updatedSite: Site) => void
}

const SiteDetailsModal = ({ site, employees, checklistPdfs, onClose, onSiteUpdate }: SiteDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'checklists'>('overview')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [selectedChecklistType, setSelectedChecklistType] = useState('')
  const [showAssignEmployee, setShowAssignEmployee] = useState(false)
  const [showCreateChecklist, setShowCreateChecklist] = useState(false)

  // Filter employees that are not already assigned to this site
  const availableEmployees = employees.filter(emp => 
    !site.employees.some(siteEmp => siteEmp.employeeId === emp.id)
  )

  const handleAssignEmployee = async () => {
    if (!selectedEmployeeId) return

    try {
      setLoading(true)
      setError(null)
      const assignment = await siteAPI.assignEmployee(site.id, selectedEmployeeId)
      
      // Update the site with the new employee assignment
      const updatedSite = await siteAPI.getSiteById(site.id)
      onSiteUpdate(updatedSite)
      
      setSelectedEmployeeId('')
      setShowAssignEmployee(false)
    } catch (err) {
      setError('Failed to assign employee')
      console.error('Error assigning employee:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to remove this employee from the site?')) return

    try {
      setLoading(true)
      setError(null)
      await siteAPI.removeEmployee(site.id, employeeId)
      
      // Update the site
      const updatedSite = await siteAPI.getSiteById(site.id)
      onSiteUpdate(updatedSite)
    } catch (err) {
      setError('Failed to remove employee')
      console.error('Error removing employee:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChecklist = async () => {
    if (!selectedEmployeeId || !selectedChecklistType) return

    try {
      setLoading(true)
      setError(null)
      // Find the selected PDF
      const selectedPdf = checklistPdfs.find(pdf => pdf.name === selectedChecklistType)
      await siteAPI.createChecklist(site.id, {
        employeeId: selectedEmployeeId,
        type: selectedChecklistType, // store the PDF name as type
        fileUrl: selectedPdf?.fileUrl, // optionally store the PDF URL
        pdfName: selectedPdf?.name // store the PDF name for download
      })
      // Update the site
      const updatedSite = await siteAPI.getSiteById(site.id)
      onSiteUpdate(updatedSite)
      setSelectedEmployeeId('')
      setSelectedChecklistType('')
      setShowCreateChecklist(false)
    } catch (err) {
      setError('Failed to create checklist')
      console.error('Error creating checklist:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateChecklistStatus = async (checklistId: string, status: 'PENDING' | 'COMPLETED') => {
    try {
      setLoading(true)
      setError(null)
      await siteAPI.updateChecklistStatus(checklistId, { status })
      
      // Update the site
      const updatedSite = await siteAPI.getSiteById(site.id)
      onSiteUpdate(updatedSite)
    } catch (err) {
      setError('Failed to update checklist status')
      console.error('Error updating checklist:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadFile = (fileUrl: string) => {
    if (fileUrl) {
      // Use the full Firebase URL directly
      window.open(fileUrl, '_blank')
    }
  }

  const refreshSiteData = async () => {
    try {
      const updatedSite = await siteAPI.getSiteById(site.id)
      onSiteUpdate(updatedSite)
    } catch (err) {
      console.error('Error refreshing site data:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{site.name}</h2>
            <p className="text-sm text-gray-600">{site.location}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'employees', label: 'Employees', icon: '👥' },
              { id: 'checklists', label: 'Checklists', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{site.employees.length}</div>
                  <div className="text-sm text-blue-700">Assigned Employees</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {site.checklists.filter(c => c.status === 'PENDING').length}
                  </div>
                  <div className="text-sm text-yellow-700">Pending Checklists</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {site.checklists.filter(c => c.status === 'COMPLETED').length}
                  </div>
                  <div className="text-sm text-green-700">Completed Checklists</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Site Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Created:</span>
                      <span className="ml-2 text-gray-600">{formatDateTime(site.createdAt)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Updated:</span>
                      <span className="ml-2 text-gray-600">{formatDateTime(site.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Assigned Employees</h3>
                <button
                  onClick={() => setShowAssignEmployee(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  disabled={availableEmployees.length === 0}
                >
                  Assign Employee
                </button>
              </div>

              {site.employees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No employees assigned to this site
                </div>
              ) : (
                <div className="space-y-3">
                  {site.employees.map((siteEmployee) => (
                    <div key={siteEmployee.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {siteEmployee.employee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{siteEmployee.employee.name}</div>
                          <div className="text-sm text-gray-600">{siteEmployee.employee.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(siteEmployee.employee.role)}`}>
                          {siteEmployee.employee.role}
                        </span>
                        <button
                          onClick={() => handleRemoveEmployee(siteEmployee.employeeId)}
                          className="text-red-600 hover:text-red-800 text-sm"
                          disabled={loading}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Assign Employee Modal */}
              {showAssignEmployee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Assign Employee</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select Employee
                        </label>
                        <select
                          value={selectedEmployeeId}
                          onChange={(e) => setSelectedEmployeeId(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded"
                          disabled={loading}
                        >
                          <option value="">Select an employee</option>
                          {availableEmployees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.email}) - {emp.role}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {selectedEmployeeId && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Role
                          </label>
                          <div className="p-2 bg-gray-50 rounded border">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(availableEmployees.find(emp => emp.id === selectedEmployeeId)?.role || 'FOREMAN')}`}>
                              {availableEmployees.find(emp => emp.id === selectedEmployeeId)?.role || 'FOREMAN'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Employee roles are managed in the Employee Management section
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => setShowAssignEmployee(false)}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAssignEmployee}
                        disabled={!selectedEmployeeId || loading}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'checklists' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Checklists</h3>
                <button
                  onClick={() => setShowCreateChecklist(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  disabled={site.employees.length === 0}
                >
                  Create Checklist
                </button>
              </div>

              {site.checklists.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No checklists created for this site
                </div>
              ) : (
                <div className="space-y-3">
                  {site.checklists.map((checklist) => (
                    <div key={checklist.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChecklistStatusColor(checklist.status)}`}>
                            {checklist.status}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900">{checklist.type}</div>
                            <div className="text-sm text-gray-600">
                              Assigned to {checklist.employee.name}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-sm text-gray-500">
                            {formatDateTime(checklist.createdAt)}
                          </div>
                          
                          {/* File Viewing Options */}
                          {checklist.fileUrl && (
                            <button
                              onClick={() => handleDownloadFile(checklist.fileUrl!)}
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View File
                            </button>
                          )}
                          
                          {/* Status Toggle Buttons */}
                          {checklist.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateChecklistStatus(checklist.id, 'COMPLETED')}
                              className="text-green-600 hover:text-green-800 text-sm"
                              disabled={loading}
                            >
                              Mark Complete
                            </button>
                          )}
                          {checklist.status === 'COMPLETED' && (
                            <button
                              onClick={() => handleUpdateChecklistStatus(checklist.id, 'PENDING')}
                              className="text-yellow-600 hover:text-yellow-800 text-sm"
                              disabled={loading}
                            >
                              Mark Pending
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* File Status Indicator */}
                      {checklist.fileUrl && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            File uploaded by employee
                            {checklist.completedAt && (
                              <span className="ml-2 text-gray-500">
                                on {formatDateTime(checklist.completedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Create Checklist Modal */}
              {showCreateChecklist && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Create Checklist</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assign to Employee
                        </label>
                        <select
                          value={selectedEmployeeId}
                          onChange={(e) => setSelectedEmployeeId(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded"
                          disabled={loading}
                        >
                          <option value="">Select an employee</option>
                          {site.employees.map((siteEmp) => (
                            <option key={siteEmp.employeeId} value={siteEmp.employeeId}>
                              {siteEmp.employee.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Checklist Type
                        </label>
                        <select
                          value={selectedChecklistType}
                          onChange={(e) => setSelectedChecklistType(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded"
                          disabled={loading}
                        >
                          <option value="">Select a checklist PDF</option>
                          {checklistPdfs.map((pdf) => (
                            <option key={pdf.name} value={pdf.name}>{pdf.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => setShowCreateChecklist(false)}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateChecklist}
                        disabled={!selectedEmployeeId || !selectedChecklistType || loading}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {loading ? 'Creating...' : 'Create'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SiteDetailsModal 