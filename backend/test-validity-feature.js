const { calculateExpiryDate, getValidityType, getValidYears, hasValidityRule, getAllValidityRules } = require('./dist/utils/certificationValidityMap');

console.log('=== Certification Validity Map Feature Test ===\n');

// Test 1: Lifetime certification
console.log('Test 1: Lifetime Certification');
const lifetimeCert = 'Accident Investigation';
console.log(`Certification: ${lifetimeCert}`);
console.log(`Has validity rule: ${hasValidityRule(lifetimeCert)}`);
console.log(`Validity type: ${getValidityType(lifetimeCert)}`);
console.log(`Valid years: ${getValidYears(lifetimeCert)}`);
console.log(`Calculated expiry date: ${calculateExpiryDate(lifetimeCert)}`);
console.log('');

// Test 2: Fixed years certification
console.log('Test 2: Fixed Years Certification');
const fixedYearsCert = 'First Aid / CPR / AED - Standard/Emergency';
console.log(`Certification: ${fixedYearsCert}`);
console.log(`Has validity rule: ${hasValidityRule(fixedYearsCert)}`);
console.log(`Validity type: ${getValidityType(fixedYearsCert)}`);
console.log(`Valid years: ${getValidYears(fixedYearsCert)}`);
console.log(`Calculated expiry date: ${calculateExpiryDate(fixedYearsCert)}`);
console.log('');

// Test 3: Unknown certification
console.log('Test 3: Unknown Certification');
const unknownCert = 'Some Random Certification';
console.log(`Certification: ${unknownCert}`);
console.log(`Has validity rule: ${hasValidityRule(unknownCert)}`);
console.log(`Validity type: ${getValidityType(unknownCert)}`);
console.log(`Valid years: ${getValidYears(unknownCert)}`);
console.log(`Calculated expiry date: ${calculateExpiryDate(unknownCert)}`);
console.log('');

// Test 4: All validity rules
console.log('Test 4: All Validity Rules');
const allRules = getAllValidityRules();
console.log(`Total rules: ${Object.keys(allRules).length}`);
console.log('Sample rules:');
Object.entries(allRules).slice(0, 5).forEach(([name, rule]) => {
  console.log(`  ${name}: ${rule.type}${rule.years ? ` (${rule.years} years)` : ''}`);
});
console.log('');

// Test 5: Different certification types
console.log('Test 5: Different Certification Types');
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