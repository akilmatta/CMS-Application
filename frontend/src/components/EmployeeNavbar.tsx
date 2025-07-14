

interface EmployeeNavbarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const EmployeeNavbar = ({ activeTab, onTabChange }: EmployeeNavbarProps) => {
  const tabs = [
    { id: 'dashboard', label: 'Employee Dashboard', icon: '📊' },
    { id: 'list', label: 'Employee List', icon: '👥' },
    { id: 'certifications', label: 'Certifications List', icon: '📜' }
  ]

  return (
    <div className="bg-white border-b border-gray-200 mb-6">
      <div className="flex space-x-8 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default EmployeeNavbar 