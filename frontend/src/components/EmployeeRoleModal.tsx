import { useState } from 'react'
import { Employee, getRoleColor } from '../services/api'

interface EmployeeRoleModalProps {
  employee: Employee
  onClose: () => void
  onUpdate: (employeeId: string, role: string) => Promise<void>
}

const EmployeeRoleModal = ({ employee, onClose, onUpdate }: EmployeeRoleModalProps) => {
  const [selectedRole, setSelectedRole] = useState(employee.role)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpdateRole = async () => {
    if (selectedRole === employee.role) {
      onClose()
      return
    }

    try {
      setLoading(true)
      setError(null)
      await onUpdate(employee.id, selectedRole)
      onClose()
    } catch (err) {
      setError('Failed to update employee role')
      console.error('Error updating employee role:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Update Employee Role</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee
              </label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{employee.name}</div>
                <div className="text-sm text-gray-600">{employee.email}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Role
              </label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(employee.role)}`}>
                  {employee.role}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="HEAD_OFFICE">Head Office</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="FOREMAN">Foreman</option>
                <option value="HSE">HSE</option>
                <option value="ELECTRICAL">Electrical</option>
              </select>
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Role Descriptions:</p>
              <ul className="space-y-1 text-xs">
                <li><strong>Head Office:</strong> Administrative and management roles</li>
                <li><strong>Supervisor:</strong> Site supervision and coordination</li>
                <li><strong>Foreman:</strong> Direct site work supervision</li>
                <li><strong>HSE:</strong> Health, Safety, and Environment</li>
                <li><strong>Electrical:</strong> Electrical work specialization</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateRole}
            disabled={loading || selectedRole === employee.role}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </>
            ) : (
              'Update Role'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmployeeRoleModal 