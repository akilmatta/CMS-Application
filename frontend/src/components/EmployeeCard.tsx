import { useState } from 'react'
import { certificationAPI, formatDate, getStatusColor, getValidityTypeColor, getStatusText } from '../services/api'
import CertificationForm from './CertificationForm'

interface Certification {
  id: string
  name: string
  expiryDate: string | null
  validityType: 'LIFETIME' | 'FIXED_YEARS' | 'CUSTOM_DATE'
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
  const [editingCertification, setEditingCertification] = useState<string | null>(null)

  const handleDeleteCertification = async (certificationId: string) => {
    if (window.confirm('Are you sure you want to delete this certification?')) {
      try {
        await certificationAPI.deleteCertification(certificationId)
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
        <CertificationForm
          employeeId={employee.id}
          onSuccess={() => {
            setShowAddCertification(false)
            onEmployeeUpdate()
          }}
          onCancel={() => setShowAddCertification(false)}
        />
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
                    {getStatusText(certification.expiryDate)}
                  </span>
                  {certification.validityType && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getValidityTypeColor(certification.validityType)}`}>
                      {certification.validityType}
                      {certification.validityType === 'FIXED_YEARS' && certification.validYears && ` (${certification.validYears}y)`}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Expires: {formatDate(certification.expiryDate)}
                </p>
              </div>
              
              <div className="flex space-x-2">
                {editingCertification === certification.id ? (
                  <CertificationForm
                    employeeId={employee.id}
                    certificationId={certification.id}
                    isEditing={true}
                    initialData={{
                      name: certification.name,
                      expiryDate: certification.expiryDate || '',
                      validityType: certification.validityType,
                      validYears: certification.validYears
                    }}
                    onSuccess={() => {
                      setEditingCertification(null)
                      onEmployeeUpdate()
                    }}
                    onCancel={() => setEditingCertification(null)}
                  />
                ) : (
                  <>
                    <button
                      onClick={() => setEditingCertification(certification.id)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCertification(certification.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
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