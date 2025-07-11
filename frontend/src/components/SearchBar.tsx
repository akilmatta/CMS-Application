import React from 'react'

interface SearchBarProps {
  searchTerm: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSearch: () => void
  onClear: () => void
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void
  isSearching: boolean
  hasResults: boolean
  placeholder?: string
}

const SearchBar = ({ 
  searchTerm, 
  onSearchChange, 
  onSearch, 
  onClear, 
  onKeyPress, 
  isSearching, 
  hasResults,
  placeholder = "Search for an employee..."
}: SearchBarProps) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center space-x-2">
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
    </div>
  )
}

export default SearchBar 