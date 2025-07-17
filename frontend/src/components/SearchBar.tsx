import React from 'react'

interface SearchFilters {
  searchIn: 'all' | 'employees' | 'certifications'
  expiryStatus: 'all' | 'expired' | 'expiring-soon' | 'valid' | 'lifetime'
  validityType: 'all' | 'LIFETIME' | 'FIXED_YEARS' | 'CUSTOM_DATE'
}

interface SearchBarProps {
  searchTerm: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSearch: () => void
  onClear: () => void
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void
  isSearching: boolean
  hasResults: boolean
  placeholder?: string
  searchFilters?: SearchFilters
  onFilterChange?: (filters: SearchFilters) => void
  showFilters?: boolean
  searchMode?: 'simple' | 'advanced'
}

const SearchBar = ({ 
  searchTerm, 
  onSearchChange, 
  onSearch, 
  onClear, 
  onKeyPress, 
  isSearching, 
  hasResults,
  placeholder = "Search...",
  searchFilters,
  onFilterChange,
  showFilters = false,
  searchMode = 'simple'
}: SearchBarProps) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      {/* Search Input */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={onSearchChange}
            onKeyPress={onKeyPress}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={onSearch}
          disabled={!searchTerm.trim()}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
        {hasResults && (
          <button
            onClick={onClear}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Search Filters - Only show for advanced mode */}
      {showFilters && searchMode === 'advanced' && searchFilters && onFilterChange && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Scope Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search In:</label>
            <select
              value={searchFilters.searchIn}
              onChange={(e) => onFilterChange({ ...searchFilters, searchIn: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Fields</option>
              <option value="employees">Employee Names Only</option>
              <option value="certifications">Certifications Only</option>
            </select>
          </div>

          {/* Expiry Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Status:</label>
            <select
              value={searchFilters.expiryStatus}
              onChange={(e) => onFilterChange({ ...searchFilters, expiryStatus: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="expired">Expired</option>
              <option value="expiring-soon">Expiring Soon (≤30 days)</option>
              <option value="valid">Valid</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>

          {/* Validity Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Validity Type:</label>
            <select
              value={searchFilters.validityType}
              onChange={(e) => onFilterChange({ ...searchFilters, validityType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="LIFETIME">Lifetime</option>
              <option value="FIXED_YEARS">Fixed Years</option>
              <option value="CUSTOM_DATE">Custom Date</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBar 