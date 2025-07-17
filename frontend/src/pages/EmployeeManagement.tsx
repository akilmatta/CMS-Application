import { useState, useEffect } from 'react'
import { employeeAPI, type Employee } from '../services/api'
import EmployeeNavbar from '../components/EmployeeNavbar'
import EmployeeCard from '../components/EmployeeCard'
import SearchBar from '../components/SearchBar'
import ValidityStatistics from '../components/ValidityStatistics'

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Employee[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchFilters, setSearchFilters] = useState({
    searchIn: 'all' as 'all' | 'employees' | 'certifications',
    expiryStatus: 'all' as 'all' | 'expired' | 'expiring-soon' | 'valid' | 'lifetime',
    validityType: 'all' as 'all' | 'LIFETIME' | 'FIXED_YEARS' | 'CUSTOM_DATE'
  })
  const [dashboardFilter, setDashboardFilter] = useState<'expiring-soon' | 'expired' | null>(null)

  // Fetch employees data
  const fetchEmployees = async () => {
    setLoading(true)
    try {
      console.log('Fetching employees from API')
      const data = await employeeAPI.getEmployees()
      console.log('Employees response:', data)
      setEmployees(data)
    } catch (error: any) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('Uploading file:', file.name, file.size, file.type)
    setUploading(true)

    try {
      console.log('Sending request to upload API')
      const response = await employeeAPI.uploadExcel(file)
      console.log('Upload response:', response)
      
      // Show success message with upsert details
      const message = response.created > 0 || response.updated > 0
        ? `Successfully processed ${response.totalEmployees} employees (${response.created} created, ${response.updated} updated)`
        : `Successfully processed ${response.totalEmployees} employees`
      alert(message)
      
      await fetchEmployees()
    } catch (error: any) {
      console.error('Error uploading file:', error)
      alert(`Upload failed: ${error.response?.data?.error || error.message}`)
    } finally {
      setUploading(false)
    }
  }

  // Handle employee creation
  const handleAddEmployee = async () => {
    if (!newEmployeeName.trim()) return

    try {
      await employeeAPI.createEmployee(newEmployeeName)
      setNewEmployeeName('')
      setShowAddEmployee(false)
      await fetchEmployees()
    } catch (error) {
      console.error('Error adding employee:', error)
    }
  }

  // Handle employee deletion
  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      await employeeAPI.deleteEmployee(employeeId)
      await fetchEmployees()
      // Clear search results if the deleted employee was in search results
      setSearchResults(prev => prev.filter(emp => emp.id !== employeeId))
    } catch (error) {
      console.error('Error deleting employee:', error)
    }
  }

  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    setSearchFilters(newFilters)
    // Always call handleSearch, even if searchTerm is empty
    handleSearch(newFilters)
  }

  // Enhanced search functionality
  const handleSearch = (overrideFilters?: any) => {
    const filters = overrideFilters || searchFilters
    const searchLower = searchTerm.toLowerCase()
    
    // Different search behavior based on active tab
    let filteredEmployees: Employee[] = []
    
    if (activeTab === 'list') {
      // Simple search for employee list - only search employee names
      filteredEmployees = employees.filter(employee =>
        employee.name.toLowerCase().includes(searchLower)
      )
    } else if (activeTab === 'certifications') {
      // Advanced search for certifications list - search across multiple fields
      const matchingEmployees = employees.filter(employee => {
        // Search in employee name
        const nameMatch = employee.name.toLowerCase().includes(searchLower)
        
        // Search in certifications
        const certificationMatch = employee.certifications.some(cert => {
          const certNameMatch = cert.name.toLowerCase().includes(searchLower)
          const validityTypeMatch = cert.validityType.toLowerCase().includes(searchLower)
          const expiryDateMatch = cert.expiryDate ? 
            new Date(cert.expiryDate).toLocaleDateString().includes(searchLower) : false
          
          return certNameMatch || validityTypeMatch || expiryDateMatch
        })

        // Apply search scope filter
        let searchMatch = false
        switch (filters.searchIn) {
          case 'employees':
            searchMatch = nameMatch
            break
          case 'certifications':
            searchMatch = certificationMatch
            break
          case 'all':
          default:
            searchMatch = nameMatch || certificationMatch
            break
        }

        // If search bar is empty, ignore searchMatch and just apply filters
        if (!searchTerm.trim()) searchMatch = true

        if (!searchMatch) return false

        // Apply expiry status filter
        const today = new Date()
        const hasExpiredCerts = employee.certifications.some(cert => {
          if (!cert.expiryDate) return false
          return new Date(cert.expiryDate) < today
        })
        
        const hasExpiringSoonCerts = employee.certifications.some(cert => {
          if (!cert.expiryDate) return false
          const expiry = new Date(cert.expiryDate)
          const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
        })
        
        const hasValidCerts = employee.certifications.some(cert => {
          if (!cert.expiryDate) return false
          return new Date(cert.expiryDate) > today
        })
        
        const hasLifetimeCerts = employee.certifications.some(cert => !cert.expiryDate)

        let expiryMatch = true
        switch (filters.expiryStatus) {
          case 'expired':
            expiryMatch = hasExpiredCerts
            break
          case 'expiring-soon':
            expiryMatch = hasExpiringSoonCerts
            break
          case 'valid':
            expiryMatch = hasValidCerts
            break
          case 'lifetime':
            expiryMatch = hasLifetimeCerts
            break
          case 'all':
          default:
            expiryMatch = true
            break
        }

        if (!expiryMatch) return false

        // Apply validity type filter
        let validityMatch = true
        if (filters.validityType !== 'all') {
          validityMatch = employee.certifications.some(cert => 
            cert.validityType === filters.validityType
          )
        }

        return validityMatch
      })

      // Filter certifications within each matching employee
      filteredEmployees = matchingEmployees.map(employee => {
        const today = new Date()
        
        // Filter certifications based on search term and filters
        const filteredCertifications = employee.certifications.filter(cert => {
          // Check if certification matches search term
          const certNameMatch = cert.name.toLowerCase().includes(searchLower)
          const validityTypeMatch = cert.validityType.toLowerCase().includes(searchLower)
          const expiryDateMatch = cert.expiryDate ? 
            new Date(cert.expiryDate).toLocaleDateString().includes(searchLower) : false
          
          let searchMatch = false
          switch (filters.searchIn) {
            case 'employees':
              // If searching only employees, show all certifications
              searchMatch = true
              break
            case 'certifications':
              searchMatch = certNameMatch || validityTypeMatch || expiryDateMatch
              break
            case 'all':
            default:
              searchMatch = certNameMatch || validityTypeMatch || expiryDateMatch
              break
          }

          // If search bar is empty, ignore searchMatch and just apply filters
          if (!searchTerm.trim()) searchMatch = true

          if (!searchMatch) return false

          // Apply expiry status filter
          let expiryMatch = true
          if (filters.expiryStatus !== 'all') {
            if (!cert.expiryDate) {
              expiryMatch = filters.expiryStatus === 'lifetime'
            } else {
              const expiry = new Date(cert.expiryDate)
              const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              
              switch (filters.expiryStatus) {
                case 'expired':
                  expiryMatch = expiry < today
                  break
                case 'expiring-soon':
                  expiryMatch = daysUntilExpiry <= 30 && daysUntilExpiry >= 0
                  break
                case 'valid':
                  expiryMatch = expiry > today
                  break
                case 'lifetime':
                  expiryMatch = false // Already handled above
                  break
              }
            }
          }

          if (!expiryMatch) return false

          // Apply validity type filter
          if (filters.validityType !== 'all') {
            return cert.validityType === filters.validityType
          }

          return true
        })

        return {
          ...employee,
          certifications: filteredCertifications
        }
      }).filter(employee => employee.certifications.length > 0) // Only show employees with matching certifications
    }

    setSearchResults(filteredEmployees)
    setIsSearching(false)
  }

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    
    // Clear search results if search term is empty
    if (!value.trim()) {
      setSearchResults([])
      setIsSearching(false)
    }
  }

  // Handle search on Enter key
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Calculate dashboard statistics
  const getDashboardStats = () => {
    const totalEmployees = employees.length
    const totalCertifications = employees.reduce((sum, emp) => sum + emp.certifications.length, 0)
    
    const today = new Date()
    const expiringSoon = employees.reduce((sum, emp) => {
      return sum + emp.certifications.filter(cert => {
        if (!cert.expiryDate) return false // Skip lifetime certifications
        const expiry = new Date(cert.expiryDate)
        const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
      }).length
    }, 0)
    
    const expired = employees.reduce((sum, emp) => {
      return sum + emp.certifications.filter(cert => {
        if (!cert.expiryDate) return false // Skip lifetime certifications
        const expiry = new Date(cert.expiryDate)
        return expiry < today
      }).length
    }, 0)

    return { totalEmployees, totalCertifications, expiringSoon, expired }
  }

  // Filter employees/certifications for dashboard filter
  const getDashboardFilteredEmployees = () => {
    if (!dashboardFilter) return searchResults.length > 0 ? searchResults : employees
    const today = new Date()
    if (dashboardFilter === 'expiring-soon') {
      return (searchResults.length > 0 ? searchResults : employees)
        .map(emp => ({
          ...emp,
          certifications: emp.certifications.filter(cert => {
            if (!cert.expiryDate) return false
            const expiry = new Date(cert.expiryDate)
            const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
          })
        }))
        .filter(emp => emp.certifications.length > 0)
    }
    if (dashboardFilter === 'expired') {
      return (searchResults.length > 0 ? searchResults : employees)
        .map(emp => ({
          ...emp,
          certifications: emp.certifications.filter(cert => {
            if (!cert.expiryDate) return false
            const expiry = new Date(cert.expiryDate)
            return expiry < today
          })
        }))
        .filter(emp => emp.certifications.length > 0)
    }
    return searchResults.length > 0 ? searchResults : employees
  }

  // Helper to set dashboard filter and go to certifications tab
  const handleDashboardCardClick = (expiryStatus: 'expiring-soon' | 'expired') => {
    setActiveTab('certifications')
    const newFilters = {
      ...searchFilters,
      expiryStatus: expiryStatus as 'expired' | 'expiring-soon',
    }
    setSearchFilters(newFilters)
    handleSearch(newFilters)
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  // Auto-trigger search when switching to certifications tab with expiring-soon or expired filter
  useEffect(() => {
    if (
      activeTab === 'certifications' &&
      (searchFilters.expiryStatus === 'expiring-soon' || searchFilters.expiryStatus === 'expired')
    ) {
      handleSearch()
    }
  }, [activeTab, searchFilters.expiryStatus])

  const stats = getDashboardStats()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Employee Management</h1>
        
        {/* Employee Navigation */}
        <EmployeeNavbar activeTab={activeTab} onTabChange={tab => {
          setActiveTab(tab)
          setDashboardFilter(null) // Clear dashboard filter when switching tabs
        }} />

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-600">Total Employees</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.totalEmployees}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-2xl">📜</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-600">Total Certifications</p>
                    <p className="text-2xl font-bold text-green-900">{stats.totalCertifications}</p>
                  </div>
                </div>
              </div>
              
              {/* Expiring Soon Card - clickable */}
              <button
                className="bg-yellow-50 p-6 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-yellow-400"
                onClick={() => handleDashboardCardClick('expiring-soon')}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-yellow-600">Expiring Soon</p>
                    <p className="text-2xl font-bold text-yellow-900">{stats.expiringSoon}</p>
                  </div>
                </div>
              </button>
              
              {/* Expired Card - clickable */}
              <button
                className="bg-red-50 p-6 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-red-400"
                onClick={() => handleDashboardCardClick('expired')}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <span className="text-2xl">❌</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-red-600">Expired</p>
                    <p className="text-2xl font-bold text-red-900">{stats.expired}</p>
                  </div>
                </div>
              </button>
            </div>

            {/* File Upload Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Upload Employee Data</h3>
              <div className="text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploading ? 'Uploading...' : 'Upload Excel File'}
                </label>
                            <p className="mt-2 text-sm text-gray-500">
              Upload an Excel file with employee and certification data
            </p>
            <div className="mt-4 text-xs text-gray-600 bg-gray-100 p-3 rounded">
              <p className="font-medium mb-2">Expected Excel Format:</p>
              <p>• Column A: Employee Names</p>
              <p>• Row 1: Certification names (starting from column B)</p>
              <p>• Data rows: Expiry dates for each certification</p>
              <p>• Supported formats: .xlsx, .xls (max 5MB)</p>
            </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Employee List</h3>
              <button
                onClick={() => setShowAddEmployee(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Add Employee
              </button>
            </div>

            {/* Search Section - Simple search for employee list */}
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={handleSearchInputChange}
              onSearch={handleSearch}
              onClear={() => {
                setSearchTerm('')
                setSearchResults([])
              }}
              onKeyPress={handleSearchKeyPress}
              isSearching={isSearching}
              hasResults={searchResults.length > 0}
              placeholder="Search employee names..."
              searchMode="simple"
            />
            
            {/* Search Results Summary */}
            {searchResults.length > 0 && (
              <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded">
                Found {searchResults.length} employee(s) matching "{searchTerm}"
              </div>
            )}

            {/* Add Employee Form */}
            {showAddEmployee && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Add New Employee</h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Employee name"
                    value={newEmployeeName}
                    onChange={(e) => setNewEmployeeName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddEmployee}
                    disabled={!newEmployeeName.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddEmployee(false)
                      setNewEmployeeName('')
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Dashboard Filter Indicator & Clear Button */}
            {dashboardFilter && (
              <div className="flex items-center mb-2">
                <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded mr-2">
                  Showing: {dashboardFilter === 'expiring-soon' ? 'Expiring Soon' : 'Expired'}
                </span>
                <button
                  className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setDashboardFilter(null)}
                >
                  Clear Filter
                </button>
              </div>
            )}

            {/* Employees List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading employees...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Show search results or all employees, filtered by dashboardFilter if set */}
                {getDashboardFilteredEmployees().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {dashboardFilter
                      ? `No employees found for ${dashboardFilter === 'expiring-soon' ? 'Expiring Soon' : 'Expired'} filter.`
                      : (searchResults.length > 0 
                        ? `No employees found matching "${searchTerm}"`
                        : 'No employees found. Add employees or upload an Excel file to get started.'
                      )
                    }
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Certifications Count
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getDashboardFilteredEmployees().map((employee) => (
                          <tr key={employee.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {employee.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {employee.certifications.length}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => handleDeleteEmployee(employee.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'certifications' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Certifications List</h3>
            
            {/* Search Section for Certifications - Advanced search with filters */}
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={handleSearchInputChange}
              onSearch={handleSearch}
              onClear={() => {
                setSearchTerm('')
                setSearchResults([])
              }}
              onKeyPress={handleSearchKeyPress}
              isSearching={isSearching}
              hasResults={searchResults.length > 0}
              placeholder="Search employees, certifications, expiry dates..."
              searchFilters={searchFilters}
              onFilterChange={handleFilterChange}
              showFilters={true}
              searchMode="advanced"
            />
            
            {/* Search Results Summary */}
            {searchResults.length > 0 && (
              <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded">
                Found {searchResults.length} employee(s) with certifications matching "{searchTerm}"
              </div>
            )}
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading employees...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Show search results or all employees */}
                {(searchResults.length > 0 ? searchResults : employees).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchResults.length > 0 
                      ? `No employees found matching "${searchTerm}"`
                      : 'No employees found. Add employees or upload an Excel file to get started.'
                    }
                  </div>
                ) : (
                  (searchResults.length > 0 ? searchResults : employees).map((employee) => (
                    <EmployeeCard
                      key={employee.id}
                      employee={employee}
                      onEmployeeUpdate={fetchEmployees}
                      onEmployeeDelete={handleDeleteEmployee}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'validity-stats' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Validity Statistics</h3>
            <ValidityStatistics />
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployeeManagement 