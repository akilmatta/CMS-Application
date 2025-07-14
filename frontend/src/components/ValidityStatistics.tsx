import { useState, useEffect } from 'react'
import { validityMapAPI, type ValidityStatistics } from '../services/api'

const ValidityStatistics = () => {
  const [statistics, setStatistics] = useState<ValidityStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await validityMapAPI.getValidityStatistics()
      setStatistics(data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading validity statistics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error loading statistics: {error}</p>
          <button
            onClick={fetchStatistics}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500 text-center">No statistics available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-6">Validity Statistics</h3>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-xl">📊</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total Certifications</p>
              <p className="text-2xl font-bold text-blue-900">{statistics.totalCertifications}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-xl">♾️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">Lifetime</p>
              <p className="text-2xl font-bold text-purple-900">{statistics.validityTypeBreakdown.lifetime}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-xl">📅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Fixed Years</p>
              <p className="text-2xl font-bold text-blue-900">{statistics.validityTypeBreakdown.fixedYears}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <span className="text-xl">📝</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Custom Date</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.validityTypeBreakdown.customDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-900">{statistics.expiringSoon}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-xl">❌</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-600">Expired</p>
              <p className="text-2xl font-bold text-red-900">{statistics.expired}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Validity Map Info */}
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h4 className="font-medium text-green-800 mb-2">Validity Map Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-green-700">
              <span className="font-medium">Total Rules:</span> {statistics.validityMap.totalRules}
            </p>
            <p className="text-sm text-green-700">
              <span className="font-medium">Lifetime Rules:</span> {
                Object.values(statistics.validityMap.rules).filter(rule => rule.type === 'LIFETIME').length
              }
            </p>
            <p className="text-sm text-green-700">
              <span className="font-medium">Fixed Years Rules:</span> {
                Object.values(statistics.validityMap.rules).filter(rule => rule.type === 'FIXED_YEARS').length
              }
            </p>
          </div>
          <div>
            <p className="text-sm text-green-700">
              <span className="font-medium">Coverage:</span> {
                statistics.totalCertifications > 0 
                  ? `${Math.round((statistics.validityTypeBreakdown.lifetime + statistics.validityTypeBreakdown.fixedYears) / statistics.totalCertifications * 100)}%`
                  : '0%'
              } of certifications use validity rules
            </p>
          </div>
        </div>
      </div>

      {/* Validity Rules List */}
      <div>
        <h4 className="font-medium mb-3">Validity Rules</h4>
        <div className="max-h-64 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(statistics.validityMap.rules).map(([name, rule]) => (
              <div key={name} className="bg-gray-50 p-3 rounded border">
                <p className="font-medium text-sm text-gray-900">{name}</p>
                <p className="text-xs text-gray-600">
                  {rule.type === 'LIFETIME' ? 'Lifetime' : `${rule.years} years`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={fetchStatistics}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Statistics
        </button>
      </div>
    </div>
  )
}

export default ValidityStatistics 