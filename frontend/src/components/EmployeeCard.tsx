import { useState } from 'react'
import axios from 'axios'

// Define ValidityType enum to match backend
enum ValidityType {
  LIFETIME = 'LIFETIME',
  FIXED_YEARS = 'FIXED_YEARS',
  CUSTOM_DATE = 'CUSTOM_DATE'
}

interface Certification {
  id: string
  name: string
  expiryDate: string
  validityType?: ValidityType
  validYears?: number
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
  const [newCertification, setNewCertification] = useState({ 
    name: '', 
    expiryDate: '', 
    validityType: ValidityType.CUSTOM_DATE,
    validYears: undefined as number | undefined
  })
  const [editingCertification, setEditingCertification] = useState<string | null>(null)
  const [editData, setEditData] = useState({ 
    name: '', 
    expiryDate: '', 
    validityType: ValidityType.CUSTOM_DATE,
    validYears: undefined as number | undefined
  })

  const getStatusColor = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) return 'bg-red-100 text-red-800' // Expired
    if (daysUntilExpiry <= 30) return 'bg-yellow-100 text-yellow-800' // Expiring soon
    return 'bg-green-100 text-green-800' // Valid
  }

  const getValidityTypeColor = (validityType: ValidityType) => {
    switch (validityType) {
      case ValidityType.LIFETIME:
        return 'bg-purple-100 text-purple-800'
      case ValidityType.FIXED_YEARS:
        return 'bg-blue-100 text-blue-800'
      case ValidityType.CUSTOM_DATE:
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleAddCertification = async () => {
    try {
      const certificationData: any = {
        employeeId: employee.id,
        name: newCertification.name,
        expiryDate: newCertification.expiryDate,
        validityType: newCertification.validityType
      }

      // Add validYears if it's FIXED_YEARS type
      if (newCertification.validityType === ValidityType.FIXED_YEARS && newCertification.validYears) {
        certificationData.validYears = newCertification.validYears
      }

      await axios.post('/api/certifications', certificationData)
      setNewCertification({ 
        name: '', 
        expiryDate: '', 
        validityType: ValidityType.CUSTOM_DATE,
        validYears: undefined
      })
      setShowAddCertification(false)
      onEmployeeUpdate()
    } catch (error) {
      console.error('Error adding certification:', error)
    }
  }

  const handleEditCertification = async (certificationId: string) => {
    try {
      const updateData: any = {
        name: editData.name,
        expiryDate: editData.expiryDate,
        validityType: editData.validityType
      }

      // Add validYears if it's FIXED_YEARS type
      if (editData.validityType === ValidityType.FIXED_YEARS && editData.validYears) {
        updateData.validYears = editData.validYears
      }

      await axios.put(`/api/certifications/${certificationId}`, updateData)
      setEditingCertification(null)
      setEditData({ 
        name: '', 
        expiryDate: '', 
        validityType: ValidityType.CUSTOM_DATE,
        validYears: undefined
      })
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

  const handleValidityTypeChange = (type: ValidityType, isNew: boolean = false) => {
    const target = isNew ? newCertification : editData
    const setTarget = isNew ? setNewCertification : setEditData

    let newExpiryDate = target.expiryDate

    // Automatically calculate new expiry date based on validity type
    if (type === ValidityType.LIFETIME) {
      // Set to year 2099 for lifetime
      newExpiryDate = '2099-12-31'
    } else if (type === ValidityType.FIXED_YEARS) {
      // Calculate date based on current date + validYears
      const currentDate = new Date()
      const years = target.validYears || 1
      const newDate = new Date(currentDate)
      newDate.setFullYear(currentDate.getFullYear() + years)
      newExpiryDate = newDate.toISOString().split('T')[0]
    }
    // For CUSTOM_DATE, keep the existing date

    setTarget({
      ...target,
      validityType: type,
      validYears: type === ValidityType.FIXED_YEARS ? (target.validYears || 1) : undefined,
      expiryDate: newExpiryDate
    })
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
          <h4 className="font-medium mb-3">Add New Certification</h4>
          <div className="space-y-3">
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
            </div>
            
            {/* Validity Type Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Validity Type:</label>
              <div className="flex space-x-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="new-validity-type"
                    value={ValidityType.LIFETIME}
                    checked={newCertification.validityType === ValidityType.LIFETIME}
                    onChange={(e) => handleValidityTypeChange(e.target.value as ValidityType, true)}
                    className="mr-2"
                  />
                  <span className="text-sm">Lifetime</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="new-validity-type"
                    value={ValidityType.FIXED_YEARS}
                    checked={newCertification.validityType === ValidityType.FIXED_YEARS}
                    onChange={(e) => handleValidityTypeChange(e.target.value as ValidityType, true)}
                    className="mr-2"
                  />
                  <span className="text-sm">Fixed Years</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="new-validity-type"
                    value={ValidityType.CUSTOM_DATE}
                    checked={newCertification.validityType === ValidityType.CUSTOM_DATE}
                    onChange={(e) => handleValidityTypeChange(e.target.value as ValidityType, true)}
                    className="mr-2"
                  />
                  <span className="text-sm">Custom Date</span>
                </label>
              </div>
              
              {/* Valid Years Input for FIXED_YEARS */}
              {newCertification.validityType === ValidityType.FIXED_YEARS && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Valid for:</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newCertification.validYears || ''}
                    onChange={(e) => {
                      const years = e.target.value ? parseInt(e.target.value) : undefined
                      let newExpiryDate = newCertification.expiryDate
                      
                      if (years) {
                        // Recalculate expiry date based on new years
                        const currentDate = new Date()
                        const newDate = new Date(currentDate)
                        newDate.setFullYear(currentDate.getFullYear() + years)
                        newExpiryDate = newDate.toISOString().split('T')[0]
                      }
                      
                      setNewCertification({ 
                        ...newCertification, 
                        validYears: years,
                        expiryDate: newExpiryDate
                      })
                    }}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-sm text-gray-600">years</span>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleAddCertification}
                disabled={!newCertification.name || !newCertification.expiryDate || 
                         (newCertification.validityType === ValidityType.FIXED_YEARS && !newCertification.validYears)}
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
                  {certification.validityType && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getValidityTypeColor(certification.validityType)}`}>
                      {certification.validityType}
                      {certification.validityType === ValidityType.FIXED_YEARS && certification.validYears && ` (${certification.validYears}y)`}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Expires: {new Date(certification.expiryDate).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex space-x-2">
                {editingCertification === certification.id ? (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
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
                    </div>
                    
                    {/* Edit Validity Type */}
                    <div className="space-y-1">
                      <div className="flex space-x-2">
                        <label className="flex items-center text-xs">
                          <input
                            type="radio"
                            name={`edit-validity-${certification.id}`}
                            value={ValidityType.LIFETIME}
                            checked={editData.validityType === ValidityType.LIFETIME}
                            onChange={(e) => handleValidityTypeChange(e.target.value as ValidityType)}
                            className="mr-1"
                          />
                          <span>Lifetime</span>
                        </label>
                        <label className="flex items-center text-xs">
                          <input
                            type="radio"
                            name={`edit-validity-${certification.id}`}
                            value={ValidityType.FIXED_YEARS}
                            checked={editData.validityType === ValidityType.FIXED_YEARS}
                            onChange={(e) => handleValidityTypeChange(e.target.value as ValidityType)}
                            className="mr-1"
                          />
                          <span>Fixed Years</span>
                        </label>
                        <label className="flex items-center text-xs">
                          <input
                            type="radio"
                            name={`edit-validity-${certification.id}`}
                            value={ValidityType.CUSTOM_DATE}
                            checked={editData.validityType === ValidityType.CUSTOM_DATE}
                            onChange={(e) => handleValidityTypeChange(e.target.value as ValidityType)}
                            className="mr-1"
                          />
                          <span>Custom Date</span>
                        </label>
                      </div>
                      
                                             {editData.validityType === ValidityType.FIXED_YEARS && (
                         <div className="flex items-center space-x-1">
                           <span className="text-xs text-gray-600">Years:</span>
                           <input
                             type="number"
                             min="1"
                             max="50"
                             value={editData.validYears || ''}
                             onChange={(e) => {
                               const years = e.target.value ? parseInt(e.target.value) : undefined
                               let newExpiryDate = editData.expiryDate
                               
                               if (years) {
                                 // Recalculate expiry date based on new years
                                 const currentDate = new Date()
                                 const newDate = new Date(currentDate)
                                 newDate.setFullYear(currentDate.getFullYear() + years)
                                 newExpiryDate = newDate.toISOString().split('T')[0]
                               }
                               
                               setEditData({ 
                                 ...editData, 
                                 validYears: years,
                                 expiryDate: newExpiryDate
                               })
                             }}
                             className="w-16 px-1 py-1 border border-gray-300 rounded text-xs"
                           />
                         </div>
                       )}
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditCertification(certification.id)}
                        disabled={!editData.name || !editData.expiryDate || 
                                 (editData.validityType === ValidityType.FIXED_YEARS && !editData.validYears)}
                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCertification(null)}
                        className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingCertification(certification.id)
                        setEditData({ 
                          name: certification.name, 
                          expiryDate: certification.expiryDate.split('T')[0],
                          validityType: certification.validityType || ValidityType.CUSTOM_DATE,
                          validYears: certification.validYears
                        })
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