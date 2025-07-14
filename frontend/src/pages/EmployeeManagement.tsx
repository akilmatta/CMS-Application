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

  // Handle search functionality
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const filteredEmployees = employees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
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

  useEffect(() => {
    fetchEmployees()
  }, [])

  const stats = getDashboardStats()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Employee Management</h1>
        
        {/* Employee Navigation */}
        <EmployeeNavbar activeTab={activeTab} onTabChange={setActiveTab} />

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
              
              <div className="bg-yellow-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-yellow-600">Expiring Soon</p>
                    <p className="text-2xl font-bold text-yellow-900">{stats.expiringSoon}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <span className="text-2xl">❌</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-red-600">Expired</p>
                    <p className="text-2xl font-bold text-red-900">{stats.expired}</p>
                  </div>
                </div>
              </div>
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

            {/* Search Section */}
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
              placeholder="Search for an employee..."
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

            {/* Employees List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading employees...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Show search results or all employees */}
                {(searchResults.length > 0 ? searchResults : employees).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchResults.length > 0 
                      ? `No employees found matching "${searchTerm}"`
                      : 'No employees found. Add employees or upload an Excel file to get started.'
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
                        {(searchResults.length > 0 ? searchResults : employees).map((employee) => (
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
            
            {/* Search Section for Certifications */}
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
              placeholder="Search for an employee to view their certifications..."
            />
            
            {/* Search Results Summary */}
            {searchResults.length > 0 && (
              <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded">
                Found {searchResults.length} employee(s) matching "{searchTerm}"
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