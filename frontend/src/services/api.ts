import axios from 'axios'

// Base API configuration
const API_BASE_URL = 'http://localhost:5000/api'
const EMPLOYEES_URL = `${API_BASE_URL}/employees`
const CERTIFICATIONS_URL = `${API_BASE_URL}/certifications`
const VALIDITY_URL = `${API_BASE_URL}`

// Types
export interface Certification {
  id: string
  name: string
  expiryDate: string | null
  validityType: 'LIFETIME' | 'FIXED_YEARS' | 'CUSTOM_DATE'
  validYears?: number
}

export interface Employee {
  id: string
  name: string
  certifications: Certification[]
}

export interface ValidityRule {
  type: 'LIFETIME' | 'FIXED_YEARS'
  years?: number
}

export interface ValidityMap {
  [certificationName: string]: ValidityRule
}

export interface ValidityStatistics {
  totalCertifications: number
  validityTypeBreakdown: {
    lifetime: number
    fixedYears: number
    customDate: number
  }
  expiringSoon: number
  expired: number
  validityMap: {
    totalRules: number
    rules: ValidityMap
  }
}

export interface BulkUpdateResult {
  success: boolean
  message: string
  updatedCount: number
  errors: string[]
}

export interface CertificationValidation {
  name: string
  hasValidityRule: boolean
  validityType: 'LIFETIME' | 'FIXED_YEARS' | 'CUSTOM_DATE'
  validYears: number | null
  calculatedExpiryDate: string | null
  isLifetime: boolean
}

// Employee API
export const employeeAPI = {
  // Get all employees
  getEmployees: async (): Promise<Employee[]> => {
    const response = await axios.get(EMPLOYEES_URL)
    return response.data
  },

  // Create employee
  createEmployee: async (name: string): Promise<Employee> => {
    const response = await axios.post(EMPLOYEES_URL, { name })
    return response.data
  },

  // Delete employee
  deleteEmployee: async (id: string): Promise<void> => {
    await axios.delete(`${EMPLOYEES_URL}/${id}`)
  },

  // Upload Excel file
  uploadExcel: async (file: File): Promise<any> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await axios.post(`${EMPLOYEES_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
}

// Certification API
export const certificationAPI = {
  // Create certification
  createCertification: async (data: {
    employeeId: string
    name: string
    expiryDate?: string
    validityType?: 'LIFETIME' | 'FIXED_YEARS' | 'CUSTOM_DATE'
    validYears?: number
  }): Promise<Certification> => {
    const response = await axios.post(CERTIFICATIONS_URL, data)
    return response.data
  },

  // Update certification
  updateCertification: async (id: string, data: {
    name?: string
    expiryDate?: string
    validityType?: 'LIFETIME' | 'FIXED_YEARS' | 'CUSTOM_DATE'
    validYears?: number
  }): Promise<Certification> => {
    const response = await axios.put(`${CERTIFICATIONS_URL}/${id}`, data)
    return response.data
  },

  // Delete certification
  deleteCertification: async (id: string): Promise<void> => {
    await axios.delete(`${CERTIFICATIONS_URL}/${id}`)
  }
}

// Validity Map API
export const validityMapAPI = {
  // Get validity map
  getValidityMap: async (): Promise<{
    validityRules: ValidityMap
    certificationNames: string[]
    totalCertifications: number
  }> => {
    const response = await axios.get(`${VALIDITY_URL}/validity-map`)
    return response.data
  },

  // Get validity statistics
  getValidityStatistics: async (): Promise<ValidityStatistics> => {
    const response = await axios.get(`${VALIDITY_URL}/validity-statistics`)
    return response.data
  },

  // Validate certification name
  validateCertificationName: async (name: string): Promise<CertificationValidation> => {
    const response = await axios.get(`${VALIDITY_URL}/validate-certification/${encodeURIComponent(name)}`)
    return response.data
  },

  // Bulk update employee certifications
  bulkUpdateEmployeeCertifications: async (data: {
    employeeId: string
    validityType: 'LIFETIME' | 'FIXED_YEARS' | 'CUSTOM_DATE'
    validYears?: number
  }): Promise<BulkUpdateResult> => {
    const response = await axios.post(`${VALIDITY_URL}/bulk-update-employee-certifications`, data)
    return response.data
  },

  // Bulk update certifications by name
  bulkUpdateCertificationsByName: async (data: {
    certificationName: string
    validityType: 'LIFETIME' | 'FIXED_YEARS' | 'CUSTOM_DATE'
    validYears?: number
  }): Promise<BulkUpdateResult> => {
    const response = await axios.post(`${VALIDITY_URL}/bulk-update-certifications-by-name`, data)
    return response.data
  }
}

// Utility functions
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Lifetime'
  return new Date(dateString).toLocaleDateString()
}

export const getStatusColor = (expiryDate: string | null, currentDate?: Date): string => {
  if (!expiryDate) return 'bg-purple-100 text-purple-800' // Lifetime
  
  const today = currentDate || new Date()
  const expiry = new Date(expiryDate)
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) return 'bg-red-100 text-red-800' // Expired
  if (daysUntilExpiry <= 30) return 'bg-yellow-100 text-yellow-800' // Expiring soon
  return 'bg-green-100 text-green-800' // Valid
}

export const getValidityTypeColor = (validityType: 'LIFETIME' | 'FIXED_YEARS' | 'CUSTOM_DATE'): string => {
  switch (validityType) {
    case 'LIFETIME':
      return 'bg-purple-100 text-purple-800'
    case 'FIXED_YEARS':
      return 'bg-blue-100 text-blue-800'
    case 'CUSTOM_DATE':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const getStatusText = (expiryDate: string | null, currentDate?: Date): string => {
  if (!expiryDate) return 'Lifetime'
  
  const today = currentDate || new Date()
  const expiry = new Date(expiryDate)
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) return 'Expired'
  if (daysUntilExpiry <= 30) return 'Expiring Soon'
  return 'Valid'
} 