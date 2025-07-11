import { useState } from 'react'
import axios from 'axios'

interface Certification {
  id: string
  name: string
  expiryDate: string
}

interface Employee {
  id: string
  name: string
  certifications: Certification[]
}

interface EmployeeCardProps {
  employee: Employee
  onEmployeeUpdate: () => void
  onEmployeeDelete: (employeeId: string) => void
}

const EmployeeCard = ({ employee, onEmployeeUpdate, onEmployeeDelete }: EmployeeCardProps) => {
  const [showAddCertification, setShowAddCertification] = useState(false)
  const [newCertification, setNewCertification] = useState({ name: '', expiryDate: '' })
  const [editingCertification, setEditingCertification] = useState<string | null>(null)
  const [editData, setEditData] = useState({ name: '', expiryDate: '' })

  const getStatusColor = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) return 'bg-red-100 text-red-800' // Expired
    if (daysUntilExpiry <= 30) return 'bg-yellow-100 text-yellow-800' // Expiring soon
    return 'bg-green-100 text-green-800' // Valid
  }

  const handleAddCertification = async () => {
    try {
      await axios.post('/api/certifications', {
        employeeId: employee.id,
        name: newCertification.name,
        expiryDate: newCertification.expiryDate
      })
      setNewCertification({ name: '', expiryDate: '' })
      setShowAddCertification(false)
      onEmployeeUpdate()
    } catch (error) {
      console.error('Error adding certification:', error)
    }
  }

  const handleEditCertification = async (certificationId: string) => {
    try {
      await axios.put(`/api/certifications/${certificationId}`, editData)
      setEditingCertification(null)
      setEditData({ name: '', expiryDate: '' })
      onEmployeeUpdate()
    } catch (error) {
      console.error('Error updating certification:', error)
    }
  }

  const handleDeleteCertification = async (certificationId: string) => {
    if (window.confirm('Are you sure you want to delete this certification?')) {
      try {
        await axios.delete(`/api/certifications/${certificationId}`)
        onEmployeeUpdate()
      } catch (error) {
        console.error('Error deleting certification:', error)
      }
    }
  }

  const handleDeleteEmployee = () => {
    if (window.confirm(`Are you sure you want to delete employee "${employee.name}" and all their certifications?`)) {
      onEmployeeDelete(employee.id)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{employee.name}</h3>
          <p className="text-sm text-gray-500">{employee.certifications.length} certification(s)</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddCertification(!showAddCertification)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Add Certification
          </button>
          <button
            onClick={handleDeleteEmployee}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Delete Employee
          </button>
        </div>
      </div>

      {/* Add Certification Form */}
      {showAddCertification && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Add New Certification</h4>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Certification name"
              value={newCertification.name}
              onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={newCertification.expiryDate}
              onChange={(e) => setNewCertification({ ...newCertification, expiryDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddCertification}
              disabled={!newCertification.name || !newCertification.expiryDate}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddCertification(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Certifications List */}
      <div className="space-y-3">
        {employee.certifications.length === 0 ? (
          <p className="text-gray-500 italic">No certifications found</p>
        ) : (
          employee.certifications.map((certification) => (
            <div key={certification.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{certification.name}</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(certification.expiryDate)}`}>
                    {new Date(certification.expiryDate) < new Date() ? 'Expired' : 
                     new Date(certification.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'Expiring Soon' : 'Valid'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Expires: {new Date(certification.expiryDate).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex space-x-2">
                {editingCertification === certification.id ? (
                  <>
                    <input
                      type="text"
                      placeholder="Certification name"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="date"
                      value={editData.expiryDate}
                      onChange={(e) => setEditData({ ...editData, expiryDate: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => handleEditCertification(certification.id)}
                      className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCertification(null)}
                      className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingCertification(certification.id)
                        setEditData({ name: certification.name, expiryDate: certification.expiryDate.split('T')[0] })
                      }}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCertification(certification.id)}
                      className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default EmployeeCard 