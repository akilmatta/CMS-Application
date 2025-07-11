const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Employees</p>
                <p className="text-2xl font-bold text-blue-900">24</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">📜</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Active Certifications</p>
                <p className="text-2xl font-bold text-green-900">156</p>
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
                <p className="text-2xl font-bold text-yellow-900">8</p>
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
                <p className="text-2xl font-bold text-red-900">3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-white rounded border hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <span className="mr-3">👥</span>
                  <span>Add New Employee</span>
                </div>
              </button>
              <button className="w-full text-left p-3 bg-white rounded border hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <span className="mr-3">📜</span>
                  <span>Add Certification</span>
                </div>
              </button>
              <button className="w-full text-left p-3 bg-white rounded border hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <span className="mr-3">📊</span>
                  <span>View Reports</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-white rounded">
                <span className="mr-3 text-green-600">✓</span>
                <span className="text-sm">John Doe's certification renewed</span>
              </div>
              <div className="flex items-center p-3 bg-white rounded">
                <span className="mr-3 text-blue-600">+</span>
                <span className="text-sm">New employee Sarah Smith added</span>
              </div>
              <div className="flex items-center p-3 bg-white rounded">
                <span className="mr-3 text-yellow-600">⚠</span>
                <span className="text-sm">Mike Johnson's certification expires in 15 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 