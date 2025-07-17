export interface ValidityRule {
  type: 'LIFETIME' | 'FIXED_YEARS';
  years?: number;
}

export interface CertificationValidityMap {
  [certificationName: string]: ValidityRule;
}

// Centralized validity map for all certifications
export const CERTIFICATION_VALIDITY_MAP: CertificationValidityMap = {
  'Accident Investigation': { type: 'LIFETIME' },
  'Aerial Equipment': { type: 'LIFETIME' },
  'Asbestos Worker Awareness': { type: 'LIFETIME' },
  'Arc Flash/Electrical Safety Trainng': { type: 'LIFETIME' },
  'Basics of Supervising': { type: 'LIFETIME' },
  'Certification - Fire Alarm Electrician': { type: 'LIFETIME' },
  'Confined Space Entry Awareness': { type: 'LIFETIME' },
  'Construction Health & Safety Representative': { type: 'LIFETIME' },
  'CSA Infection Control During Construction.. Z317.13 - 17 Part I': { type: 'LIFETIME' },
  'CSA Z462-15 Standard': { type: 'LIFETIME' },
  'Elevated Work Platform': { type: 'FIXED_YEARS', years: 5 },
  'ESA / OESC 2015 - General Level 1': { type: 'LIFETIME' },
  'Fire Extinguisher Training': { type: 'LIFETIME' },
  'First Aid / CPR / AED - Standard/Emergency': { type: 'FIXED_YEARS', years: 3 },
  'Fork Lift Operator': { type: 'LIFETIME' },
  'Fundamentals of Infectious Control During Construction': { type: 'LIFETIME' },
  'Greenlee Bender 881-CT': { type: 'LIFETIME' },
  'Hoisting and Rigging': { type: 'LIFETIME' },
  'Joint Health & Safety Committee Member Certification': { type: 'FIXED_YEARS', years: 3 },
  'Ladder Safety Awareness': { type: 'LIFETIME' },
  'Lock Out/Tag Out Training': { type: 'LIFETIME' },
  'Occupational Health and Safety Management System Handbook': { type: 'LIFETIME' },
  'Powder Actuated Tools': { type: 'LIFETIME' },
  'Spill Kit Training': { type: 'LIFETIME' },
  'Supervisor Health & Safety in 5 Steps': { type: 'LIFETIME' },
  'Violence and Harassment Training': { type: 'LIFETIME' },
  'Worker Health & Safety in 4 Steps': { type: 'LIFETIME' },
  'Working at Heights - Fundamentals of Fall Provention': { type: 'FIXED_YEARS', years: 3 },
  'WHMIS 2015 - NEW VERSION': { type: 'FIXED_YEARS', years: 1 }
};

/**
 * Get validity rule for a certification name
 * @param certificationName - The name of the certification
 * @returns ValidityRule or null if not found
 */
export function getValidityRule(certificationName: string): ValidityRule | null {
  const normalizedName = certificationName.trim();
  
  // Direct match
  if (CERTIFICATION_VALIDITY_MAP[normalizedName]) {
    return CERTIFICATION_VALIDITY_MAP[normalizedName];
  }
  
  // Case-insensitive match
  const lowerCaseName = normalizedName.toLowerCase();
  for (const [key, rule] of Object.entries(CERTIFICATION_VALIDITY_MAP)) {
    if (key.toLowerCase() === lowerCaseName) {
      return rule;
    }
  }
  
  // Partial match (for cases where names might have slight variations)
  for (const [key, rule] of Object.entries(CERTIFICATION_VALIDITY_MAP)) {
    if (key.toLowerCase().includes(lowerCaseName) || lowerCaseName.includes(key.toLowerCase())) {
      return rule;
    }
  }
  
  return null;
}

/**
 * Calculate expiry date based on certification name and validity rule
 * @param certificationName - The name of the certification
 * @param customExpiryDate - Optional custom expiry date (for CUSTOM_DATE type or base date for FIXED_YEARS)
 * @returns Date object or null for lifetime certifications
 */
export function calculateExpiryDate(certificationName: string, customExpiryDate?: Date): Date | null {
  const validityRule = getValidityRule(certificationName);
  
  if (!validityRule) {
    // If no rule found, use custom date if provided, otherwise return null
    return customExpiryDate || null;
  }
  
  if (validityRule.type === 'LIFETIME') {
    return null;
  }
  
  if (validityRule.type === 'FIXED_YEARS' && validityRule.years) {
    // Use the original date from Excel file if provided, otherwise use current date
    const baseDate = customExpiryDate || new Date();
    const expiryDate = new Date(baseDate);
    expiryDate.setFullYear(baseDate.getFullYear() + validityRule.years);
    return expiryDate;
  }
  
  // Fallback to custom date if provided
  return customExpiryDate || null;
}

/**
 * Get validity type for a certification name
 * @param certificationName - The name of the certification
 * @returns 'LIFETIME', 'FIXED_YEARS', or 'CUSTOM_DATE'
 */
export function getValidityType(certificationName: string): 'LIFETIME' | 'FIXED_YEARS' | 'CUSTOM_DATE' {
  const validityRule = getValidityRule(certificationName);
  
  if (!validityRule) {
    return 'CUSTOM_DATE';
  }
  
  return validityRule.type;
}

/**
 * Get valid years for a certification name
 * @param certificationName - The name of the certification
 * @returns number of years or null
 */
export function getValidYears(certificationName: string): number | null {
  const validityRule = getValidityRule(certificationName);
  
  if (!validityRule || validityRule.type !== 'FIXED_YEARS') {
    return null;
  }
  
  return validityRule.years || null;
}

/**
 * Check if a certification name exists in the validity map
 * @param certificationName - The name of the certification
 * @returns boolean
 */
export function hasValidityRule(certificationName: string): boolean {
  return getValidityRule(certificationName) !== null;
}

/**
 * Get all certification names from the validity map
 * @returns Array of certification names
 */
export function getAllCertificationNames(): string[] {
  return Object.keys(CERTIFICATION_VALIDITY_MAP);
}

/**
 * Get all validity rules
 * @returns Object with all validity rules
 */
export function getAllValidityRules(): CertificationValidityMap {
  return { ...CERTIFICATION_VALIDITY_MAP };
} 