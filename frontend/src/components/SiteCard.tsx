import { Site, getChecklistStatusColor, formatDateTime } from '../services/api'

interface SiteCardProps {
  site: Site
  onSiteClick: () => void
  onEdit: () => void
  onDelete: () => void
}

const SiteCard = ({ site, onSiteClick, onEdit, onDelete }: SiteCardProps) => {
  const pendingChecklists = site.checklists.filter(c => c.status === 'PENDING').length
  const completedChecklists = site.checklists.filter(c => c.status === 'COMPLETED').length
  const totalEmployees = site.employees.length

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
      <div className="p-6" onClick={onSiteClick}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{site.name}</h3>
            <p className="text-sm text-gray-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {site.location}
            </p>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="text-gray-400 hover:text-blue-500 transition-colors p-1"
              title="Edit site"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Delete site"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalEmployees}</div>
            <div className="text-xs text-gray-500">Employees</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingChecklists}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedChecklists}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
        </div>

        {/* Recent Checklists */}
        {site.checklists.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Checklists</h4>
            <div className="space-y-2">
              {site.checklists.slice(0, 3).map((checklist) => (
                <div key={checklist.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChecklistStatusColor(checklist.status)}`}>
                      {checklist.status}
                    </span>
                    <span className="ml-2 text-gray-600">{checklist.type}</span>
                  </div>
                  <span className="text-gray-400 text-xs">
                    {checklist.employee.name}
                  </span>
                </div>
              ))}
              {site.checklists.length > 3 && (
                <div className="text-xs text-gray-400 text-center">
                  +{site.checklists.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Created {formatDateTime(site.createdAt)}</span>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Click to view details
          </span>
        </div>
      </div>
    </div>
  )
}

export default SiteCard 