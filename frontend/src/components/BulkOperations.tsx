import { useState, useEffect } from 'react'
import { validityMapAPI, Employee, BulkUpdateResult } from '../services/api'

interface BulkOperationsProps {
  employees: Employee[]
  onSuccess: () => void
}

const BulkOperations = ({ employees, onSuccess }: BulkOperationsProps) => {
  const [activeTab, setActiveTab] = useState<'employee' | 'certification'>('employee')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [selectedCertificationName, setSelectedCertificationName] = useState('')
  const [validityType, setValidityType] = useState<'LIFETIME' | 'FIXED_YEARS' | 'CUSTOM_DATE'>('LIFETIME')
  const [validYears, setValidYears] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<BulkUpdateResult | null>(null)
  const [certificationNames, setCertificationNames] = useState<string[]>([])

  // Fetch certification names for dropdown
  useEffect(() => {
    const fetchCertificationNames = async () => {
      try {
        const { certificationNames } = await validityMapAPI.getValidityMap()
        setCertificationNames(certificationNames)
      } catch (error) {
        console.error('Error fetching certification names:', error)
      }
    }
    fetchCertificationNames()
  }, [])

  const handleBulkUpdateEmployee = async () => {
    if (!selectedEmployeeId) {
      alert('Please select an employee')
      return
    }

    setIsSubmitting(true)
    setResult(null)

    try {
      const data: any = {
        employeeId: selectedEmployeeId,
        validityType
      }

      if (validityType === 'FIXED_YEARS') {
        data.validYears = validYears
      }

      const result = await validityMapAPI.bulkUpdateEmployeeCertifications(data)
      setResult(result)
      
      if (result.success) {
        onSuccess()
      }
    } catch (error: any) {
      console.error('Error in bulk update:', error)
      setResult({
        success: false,
        message: `Error: ${error.response?.data?.error || error.message}`,
        updatedCount: 0,
        errors: [error.response?.data?.error || error.message]
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkUpdateCertification = async () => {
    if (!selectedCertificationName) {
      alert('Please select a certification')
      return
    }

    setIsSubmitting(true)
    setResult(null)

    try {
      const data: any = {
        certificationName: selectedCertificationName,
        validityType
      }

      if (validityType === 'FIXED_YEARS') {
        data.validYears = validYears
      }

      const result = await validityMapAPI.bulkUpdateCertificationsByName(data)
      setResult(result)
      
      if (result.success) {
        onSuccess()
      }
    } catch (error: any) {
      console.error('Error in bulk update:', error)
      setResult({
        success: false,
        message: `Error: ${error.response?.data?.error || error.message}`,
        updatedCount: 0,
        errors: [error.response?.data?.error || error.message]
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedEmployeeId('')
    setSelectedCertificationName('')
    setValidityType('LIFETIME')
    setValidYears(1)
    setResult(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Bulk Operations</h3>
      
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('employee')}
          className={`px-4 py-2 rounded ${
            activeTab === 'employee' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Update by Employee
        </button>
        <button
          onClick={() => setActiveTab('certification')}
          className={`px-4 py-2 rounded ${
            activeTab === 'certification' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Update by Certification
        </button>
      </div>

      {activeTab === 'employee' && (
        <div className="space-y-4">
          <h4 className="font-medium">Update All Certifications for an Employee</h4>
          
          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Employee:
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose an employee...</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.certifications.length} certifications)
                </option>
              ))}
            </select>
          </div>

          {/* Validity Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Validity Type:
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="bulk-validity-type"
                  value="LIFETIME"
                  checked={validityType === 'LIFETIME'}
                  onChange={(e) => setValidityType(e.target.value as 'LIFETIME')}
                  className="mr-2"
                />
                <span className="text-sm">Lifetime</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="bulk-validity-type"
                  value="FIXED_YEARS"
                  checked={validityType === 'FIXED_YEARS'}
                  onChange={(e) => setValidityType(e.target.value as 'FIXED_YEARS')}
                  className="mr-2"
                />
                <span className="text-sm">Fixed Years</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="bulk-validity-type"
                  value="CUSTOM_DATE"
                  checked={validityType === 'CUSTOM_DATE'}
                  onChange={(e) => setValidityType(e.target.value as 'CUSTOM_DATE')}
                  className="mr-2"
                />
                <span className="text-sm">Custom Date</span>
              </label>
            </div>
          </div>

          {/* Valid Years for FIXED_YEARS */}
          {validityType === 'FIXED_YEARS' && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Valid for:</label>
              <input
                type="number"
                min="1"
                max="50"
                value={validYears}
                onChange={(e) => setValidYears(parseInt(e.target.value))}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <span className="text-sm text-gray-600">years</span>
            </div>
          )}

          <button
            onClick={handleBulkUpdateEmployee}
            disabled={!selectedEmployeeId || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Updating...' : 'Update Employee Certifications'}
          </button>
        </div>
      )}

      {activeTab === 'certification' && (
        <div className="space-y-4">
          <h4 className="font-medium">Update All Certifications by Name</h4>
          
          {/* Certification Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Certification:
            </label>
            <select
              value={selectedCertificationName}
              onChange={(e) => setSelectedCertificationName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a certification...</option>
              {certificationNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Validity Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Validity Type:
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="bulk-validity-type-cert"
                  value="LIFETIME"
                  checked={validityType === 'LIFETIME'}
                  onChange={(e) => setValidityType(e.target.value as 'LIFETIME')}
                  className="mr-2"
                />
                <span className="text-sm">Lifetime</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="bulk-validity-type-cert"
                  value="FIXED_YEARS"
                  checked={validityType === 'FIXED_YEARS'}
                  onChange={(e) => setValidityType(e.target.value as 'FIXED_YEARS')}
                  className="mr-2"
                />
                <span className="text-sm">Fixed Years</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="bulk-validity-type-cert"
                  value="CUSTOM_DATE"
                  checked={validityType === 'CUSTOM_DATE'}
                  onChange={(e) => setValidityType(e.target.value as 'CUSTOM_DATE')}
                  className="mr-2"
                />
                <span className="text-sm">Custom Date</span>
              </label>
            </div>
          </div>

          {/* Valid Years for FIXED_YEARS */}
          {validityType === 'FIXED_YEARS' && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Valid for:</label>
              <input
                type="number"
                min="1"
                max="50"
                value={validYears}
                onChange={(e) => setValidYears(parseInt(e.target.value))}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <span className="text-sm text-gray-600">years</span>
            </div>
          )}

          <button
            onClick={handleBulkUpdateCertification}
            disabled={!selectedCertificationName || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Updating...' : 'Update Certifications by Name'}
          </button>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className={`mt-4 p-4 rounded-lg ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <h5 className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
            {result.success ? '✓ Success' : '✗ Error'}
          </h5>
          <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            {result.message}
          </p>
          {result.success && (
            <p className="text-sm text-green-700 mt-1">
              Updated {result.updatedCount} certification(s)
            </p>
          )}
          {result.errors && result.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-700">Errors:</p>
              <ul className="text-sm text-red-700 list-disc list-inside">
                {result.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={resetForm}
            className="mt-2 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            Reset Form
          </button>
        </div>
      )}
    </div>
  )
}

export default BulkOperations 