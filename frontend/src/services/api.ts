import axios from 'axios'

// Base API configuration
const API_BASE_URL = 'http://localhost:5000/api'
const EMPLOYEES_URL = `${API_BASE_URL}/employees`
const CERTIFICATIONS_URL = `${API_BASE_URL}/certifications`
const SITES_URL = `${API_BASE_URL}/sites`
const CHECKLISTS_URL = `${API_BASE_URL}/checklists`
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
  email: string
  role: 'HEAD_OFFICE' | 'SUPERVISOR' | 'FOREMAN' | 'HSE' | 'ELECTRICAL'
  firebaseUid: string
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

// Site Management Types
export interface SiteEmployee {
  id: string
  siteId: string
  employeeId: string
  assignedAt: string
  employee: {
    id: string
    name: string
    email: string
    role: 'HEAD_OFFICE' | 'SUPERVISOR' | 'FOREMAN' | 'HSE' | 'ELECTRICAL'
  }
}

export interface Checklist {
  id: string
  siteId: string
  employeeId: string
  type: string
  status: 'PENDING' | 'COMPLETED'
  completedAt: string | null
  fileUrl: string | null
  pdfName?: string // for download filename
  createdAt: string
  updatedAt: string
  employee: {
    id: string
    name: string
    email: string
    role: 'HEAD_OFFICE' | 'SUPERVISOR' | 'FOREMAN' | 'HSE' | 'ELECTRICAL'
  }
}

export interface Site {
  id: string
  name: string
  location: string
  employees: SiteEmployee[]
  checklists: Checklist[]
  createdAt: string
  updatedAt: string
}

export interface CreateSiteData {
  name: string
  location: string
}

export interface CreateChecklistData {
  employeeId: string
  type: string
  fileUrl?: string
  pdfName?: string // for download filename
}

export interface UpdateChecklistData {
  status: 'PENDING' | 'COMPLETED'
  fileUrl?: string
}

export interface ChecklistPdf {
  id: string
  name: string
  fileUrl: string
  filePath: string
  fileName: string
  description?: string
  uploadedBy: string
  createdAt: string
  updatedAt: string
}

// Employee API
export const employeeAPI = {
  // Get all employees
  getEmployees: async (): Promise<Employee[]> => {
    const response = await axios.get(EMPLOYEES_URL)
    return response.data
  },

  // Create employee
  createEmployee: async (name: string, email?: string, role?: string): Promise<Employee> => {
    const response = await axios.post(EMPLOYEES_URL, { name, email, role })
    return response.data
  },

  // Delete employee
  deleteEmployee: async (id: string): Promise<void> => {
    await axios.delete(`${EMPLOYEES_URL}/${id}`)
  },

  // Update employee role
  updateEmployeeRole: async (id: string, role: string): Promise<Employee> => {
    const response = await axios.put(`${EMPLOYEES_URL}/${id}/role`, { role })
    return response.data
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
  },

  // New employee-specific endpoints
  getEmployeeActivity: async (employeeId: string): Promise<{
    activities: Array<{
      type: 'certification' | 'site_assignment' | 'checklist'
      id: string
      title: string
      description: string
      date: string
      data: any
    }>
    totalActivities: number
  }> => {
    const response = await axios.get(`${EMPLOYEES_URL}/${employeeId}/activity`)
    return response.data
  },

  getEmployeeSites: async (employeeId: string): Promise<{
    sites: Array<{
      id: string
      name: string
      location: string
      assignedAt: string
      taskCounts: {
        total: number
        pending: number
        completed: number
      }
    }>
    totalSites: number
    totalTasks: number
  }> => {
    const response = await axios.get(`${EMPLOYEES_URL}/${employeeId}/sites`)
    return response.data
  },

  getEmployeeTasks: (employeeId: string): Promise<EmployeeTasksResponse> =>
    axios.get(`/api/employees/${employeeId}/tasks`).then(res => res.data),

  getEmployeeSiteTasks: (employeeId: string, siteId: string): Promise<EmployeeSiteTasksResponse> =>
    axios.get(`/api/employees/${employeeId}/site-tasks/${siteId}`).then(res => res.data),

  uploadEmployeeTaskFile: (employeeId: string, taskId: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`/api/employees/${employeeId}/tasks/${taskId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },

  downloadFile: (fileUrl: string): string => {
    // If it's already a full URL (cloud storage), return it directly
    if (fileUrl.startsWith('http')) {
      return fileUrl;
    }
    // For backward compatibility with local files
    return `/api/files/${fileUrl}`;
  },

  // Direct file access - use the full URL directly
  getFileUrl: (fileUrl: string): string => {
    return fileUrl;
  },
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

// Site Management API
export const siteAPI = {
  // Get all sites
  getSites: async (): Promise<Site[]> => {
    const response = await axios.get(SITES_URL)
    return response.data
  },

  // Create site
  createSite: async (data: CreateSiteData): Promise<Site> => {
    const response = await axios.post(SITES_URL, data)
    return response.data
  },

  // Get site by ID
  getSiteById: async (id: string): Promise<Site> => {
    const response = await axios.get(`${SITES_URL}/${id}`)
    return response.data
  },

  // Update site
  updateSite: async (id: string, data: CreateSiteData): Promise<Site> => {
    const response = await axios.put(`${SITES_URL}/${id}`, data)
    return response.data
  },

  // Delete site
  deleteSite: async (id: string): Promise<void> => {
    await axios.delete(`${SITES_URL}/${id}`)
  },

  // Assign employee to site
  assignEmployee: async (siteId: string, employeeId: string): Promise<SiteEmployee> => {
    const response = await axios.post(`${SITES_URL}/${siteId}/employees`, { employeeId })
    return response.data
  },

  // Remove employee from site
  removeEmployee: async (siteId: string, employeeId: string): Promise<void> => {
    await axios.delete(`${SITES_URL}/${siteId}/employees/${employeeId}`)
  },

  // Create checklist
  createChecklist: async (siteId: string, data: CreateChecklistData): Promise<Checklist> => {
    const response = await axios.post(`${SITES_URL}/${siteId}/checklists`, data)
    return response.data
  },

  // Get site checklists
  getSiteChecklists: async (siteId: string): Promise<Checklist[]> => {
    const response = await axios.get(`${SITES_URL}/${siteId}/checklists`)
    return response.data
  },

  // Update checklist status
  updateChecklistStatus: async (checklistId: string, data: UpdateChecklistData): Promise<Checklist> => {
    const response = await axios.put(`${CHECKLISTS_URL}/${checklistId}`, data)
    return response.data
  }
}

// Utility functions for site management
export const getChecklistStatusColor = (status: 'PENDING' | 'COMPLETED'): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'COMPLETED':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const getRoleColor = (role: string): string => {
  switch (role) {
    case 'HEAD_OFFICE':
      return 'bg-purple-100 text-purple-800'
    case 'SUPERVISOR':
      return 'bg-blue-100 text-blue-800'
    case 'FOREMAN':
      return 'bg-green-100 text-green-800'
    case 'HSE':
      return 'bg-orange-100 text-orange-800'
    case 'ELECTRICAL':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString()
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

interface EmployeeTasksResponse {
  tasks: EmployeeTask[]
  pendingTasks: EmployeeTask[]
  completedTasks: EmployeeTask[]
  totalTasks: number
  pendingCount: number
  completedCount: number
}

interface EmployeeSiteTasksResponse {
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

// Checklist PDF API
export const checklistPdfAPI = {
  // Upload checklist PDF
  uploadChecklistPdf: (file: File, name: string, description?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    if (description) {
      formData.append('description', description);
    }
    return axios.post('/api/checklist-pdfs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },

  // Get all checklist PDFs
  getChecklistPdfs: (): Promise<{ checklists: ChecklistPdf[] }> =>
    axios.get('/api/checklist-pdfs').then(res => res.data),

  // Delete checklist PDF
  deleteChecklistPdf: (id: string): Promise<any> =>
    axios.delete(`/api/checklist-pdfs/${id}`).then(res => res.data),
}; 