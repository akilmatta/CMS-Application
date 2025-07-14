import { useState, useEffect } from 'react'
import { certificationAPI, validityMapAPI, CertificationValidation } from '../services/api'

interface CertificationFormProps {
  employeeId: string
  onSuccess: () => void
  onCancel: () => void
  initialData?: {
    name: string
    expiryDate: string
    validityType: 'LIFETIME' | 'FIXED_YEARS' | 'CUSTOM_DATE'
    validYears?: number
  }
  isEditing?: boolean
  certificationId?: string
}

const CertificationForm = ({ 
  employeeId, 
  onSuccess, 
  onCancel, 
  initialData,
  isEditing = false,
  certificationId 
}: CertificationFormProps) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    expiryDate: initialData?.expiryDate || '',
    validityType: initialData?.validityType || 'CUSTOM_DATE' as 'LIFETIME' | 'FIXED_YEARS' | 'CUSTOM_DATE',
    validYears: initialData?.validYears || undefined
  })

  const [validation, setValidation] = useState<CertificationValidation | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Fetch validity map for suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const { certificationNames } = await validityMapAPI.getValidityMap()
        setSuggestions(certificationNames)
      } catch (error) {
        console.error('Error fetching certification suggestions:', error)
      }
    }
    fetchSuggestions()
  }, [])

  // Validate certification name when it changes
  useEffect(() => {
    const validateName = async () => {
      if (!formData.name.trim()) {
        setValidation(null)
        return
      }

      setIsValidating(true)
      try {
        const result = await validityMapAPI.validateCertificationName(formData.name)
        setValidation(result)
        
        // Auto-fill form based on validation result
        if (result.hasValidityRule) {
          setFormData(prev => ({
            ...prev,
            validityType: result.validityType,
            validYears: result.validYears || undefined,
            expiryDate: result.calculatedExpiryDate ? new Date(result.calculatedExpiryDate).toISOString().split('T')[0] : ''
          }))
        }
      } catch (error) {
        console.error('Error validating certification name:', error)
        setValidation(null)
      } finally {
        setIsValidating(false)
      }
    }

    const timeoutId = setTimeout(validateName, 500) // Debounce validation
    return () => clearTimeout(timeoutId)
  }, [formData.name])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Please enter a certification name')
      return
    }

    setIsSubmitting(true)
    try {
      const certificationData: any = {
        employeeId,
        name: formData.name.trim()
      }

      // Only include expiryDate if it's not a lifetime certification
      if (formData.validityType !== 'LIFETIME' && formData.expiryDate) {
        certificationData.expiryDate = formData.expiryDate
      }

      // Include validity type and years
      certificationData.validityType = formData.validityType
      if (formData.validityType === 'FIXED_YEARS' && formData.validYears) {
        certificationData.validYears = formData.validYears
      }

      if (isEditing && certificationId) {
        await certificationAPI.updateCertification(certificationId, certificationData)
      } else {
        await certificationAPI.createCertification(certificationData)
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error saving certification:', error)
      alert(`Error saving certification: ${error.response?.data?.error || error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, name: value }))
    setShowSuggestions(value.length > 0)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({ ...prev, name: suggestion }))
    setShowSuggestions(false)
  }

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(formData.name.toLowerCase())
  ).slice(0, 5)

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium mb-3">
        {isEditing ? 'Edit Certification' : 'Add New Certification'}
      </h4>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Certification Name */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Certification Name *
          </label>
          <input
            type="text"
            placeholder="Enter certification name"
            value={formData.name}
            onChange={handleNameChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          
          {/* Validation indicator */}
          {isValidating && (
            <div className="absolute right-2 top-8">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {/* Validation result */}
          {validation && !isValidating && (
            <div className={`mt-1 text-sm ${validation.hasValidityRule ? 'text-green-600' : 'text-yellow-600'}`}>
              {validation.hasValidityRule ? (
                <>
                  ✓ Found validity rule: {validation.validityType}
                  {validation.validYears && ` (${validation.validYears} years)`}
                  {validation.isLifetime && ' - Lifetime certification'}
                </>
              ) : (
                '⚠ No validity rule found - will use custom date'
              )}
            </div>
          )}
          
          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Validity Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Validity Type:</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="validity-type"
                value="LIFETIME"
                checked={formData.validityType === 'LIFETIME'}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  validityType: e.target.value as 'LIFETIME',
                  expiryDate: ''
                }))}
                className="mr-2"
              />
              <span className="text-sm">Lifetime</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="validity-type"
                value="FIXED_YEARS"
                checked={formData.validityType === 'FIXED_YEARS'}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  validityType: e.target.value as 'FIXED_YEARS'
                }))}
                className="mr-2"
              />
              <span className="text-sm">Fixed Years</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="validity-type"
                value="CUSTOM_DATE"
                checked={formData.validityType === 'CUSTOM_DATE'}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  validityType: e.target.value as 'CUSTOM_DATE'
                }))}
                className="mr-2"
              />
              <span className="text-sm">Custom Date</span>
            </label>
          </div>
        </div>

        {/* Valid Years for FIXED_YEARS */}
        {formData.validityType === 'FIXED_YEARS' && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Valid for:</label>
            <input
              type="number"
              min="1"
              max="50"
              value={formData.validYears || ''}
              onChange={(e) => {
                const years = e.target.value ? parseInt(e.target.value) : undefined
                let newExpiryDate = formData.expiryDate
                
                if (years) {
                  // Recalculate expiry date based on new years
                  const currentDate = new Date()
                  const newDate = new Date(currentDate)
                  newDate.setFullYear(currentDate.getFullYear() + years)
                  newExpiryDate = newDate.toISOString().split('T')[0]
                }
                
                setFormData(prev => ({ 
                  ...prev, 
                  validYears: years,
                  expiryDate: newExpiryDate
                }))
              }}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-sm text-gray-600">years</span>
          </div>
        )}

        {/* Expiry Date for CUSTOM_DATE */}
        {formData.validityType === 'CUSTOM_DATE' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date *
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}

        {/* Calculated expiry date display */}
        {validation?.calculatedExpiryDate && formData.validityType !== 'LIFETIME' && (
          <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
            Calculated expiry date: {new Date(validation.calculatedExpiryDate).toLocaleDateString()}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex space-x-2 pt-2">
          <button
            type="submit"
            disabled={!formData.name.trim() || isSubmitting || 
                     (formData.validityType === 'FIXED_YEARS' && !formData.validYears) ||
                     (formData.validityType === 'CUSTOM_DATE' && !formData.expiryDate)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Add')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default CertificationForm 