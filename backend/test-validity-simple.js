// Simple test of the validity map logic
const CERTIFICATION_VALIDITY_MAP = {
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

function getValidityRule(certificationName) {
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
  
  return null;
}

function calculateExpiryDate(certificationName, customExpiryDate) {
  const validityRule = getValidityRule(certificationName);
  
  if (!validityRule) {
    return customExpiryDate || null;
  }
  
  if (validityRule.type === 'LIFETIME') {
    return null;
  }
  
  if (validityRule.type === 'FIXED_YEARS' && validityRule.years) {
    const currentDate = new Date();
    const expiryDate = new Date(currentDate);
    expiryDate.setFullYear(currentDate.getFullYear() + validityRule.years);
    return expiryDate;
  }
  
  return customExpiryDate || null;
}

function getValidityType(certificationName) {
  const validityRule = getValidityRule(certificationName);
  
  if (!validityRule) {
    return 'CUSTOM_DATE';
  }
  
  return validityRule.type;
}

function getValidYears(certificationName) {
  const validityRule = getValidityRule(certificationName);
  
  if (!validityRule || validityRule.type !== 'FIXED_YEARS') {
    return null;
  }
  
  return validityRule.years || null;
}

console.log('=== Certification Validity Map Feature Test ===\n');

// Test 1: Lifetime certification
console.log('Test 1: Lifetime Certification');
const lifetimeCert = 'Accident Investigation';
console.log(`Certification: ${lifetimeCert}`);
console.log(`Validity type: ${getValidityType(lifetimeCert)}`);
console.log(`Valid years: ${getValidYears(lifetimeCert)}`);
console.log(`Calculated expiry date: ${calculateExpiryDate(lifetimeCert)}`);
console.log('');

// Test 2: Fixed years certification
console.log('Test 2: Fixed Years Certification');
const fixedYearsCert = 'First Aid / CPR / AED - Standard/Emergency';
console.log(`Certification: ${fixedYearsCert}`);
console.log(`Validity type: ${getValidityType(fixedYearsCert)}`);
console.log(`Valid years: ${getValidYears(fixedYearsCert)}`);
console.log(`Calculated expiry date: ${calculateExpiryDate(fixedYearsCert)}`);
console.log('');

// Test 3: Different certification types
console.log('Test 3: Different Certification Types');
const testCerts = [
  'WHMIS 2015 - NEW VERSION', // 1 year
  'Working at Heights - Fundamentals of Fall Provention', // 3 years
  'Elevated Work Platform', // 5 years
  'Fire Extinguisher Training', // Lifetime
  'Unknown Certification' // No rule
];

testCerts.forEach(cert => {
  const validityType = getValidityType(cert);
  const validYears = getValidYears(cert);
  const expiryDate = calculateExpiryDate(cert);
  const isLifetime = validityType === 'LIFETIME';
  
  console.log(`${cert}:`);
  console.log(`  Type: ${validityType}`);
  console.log(`  Years: ${validYears || 'N/A'}`);
  console.log(`  Expiry: ${expiryDate ? expiryDate.toDateString() : 'Lifetime'}`);
  console.log(`  Is Lifetime: ${isLifetime}`);
  console.log('');
});

console.log('=== Test Complete ==='); 