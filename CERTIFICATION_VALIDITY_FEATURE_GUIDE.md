# Certification Validity Map Feature Guide

## Overview

This feature implements a centralized validity map where each certification is assigned a validity period. The system automatically calculates expiry dates based on certification names, eliminating the need for manual date entry in most cases.

## Validity Types

- **LIFETIME**: Certifications that never expire (stored as `null` expiry date)
- **FIXED_YEARS**: Certifications with a specific number of years validity (e.g., 1, 3, 5 years)
- **CUSTOM_DATE**: Certifications with manually specified expiry dates

## Centralized Validity Map

The system includes a predefined map of certification names and their validity rules:

```typescript
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
```

## How It Works

### 1. Certification Creation

When a certification is created:

1. The system looks up the certification name in the validity map
2. If found:
   - For **LIFETIME**: Sets `expiryDate` to `null`
   - For **FIXED_YEARS**: Calculates expiry date as today + N years
   - For **CUSTOM_DATE**: Uses the provided expiry date
3. If not found: Uses the provided expiry date or defaults to `null`

### 2. Certification Updates

When a certification is updated:

1. If the certification name changes, the system recalculates the expiry date based on the new name
2. If only other fields change, the expiry date remains unchanged
3. The validity type and valid years are automatically updated based on the new name

### 3. Excel Upload

When uploading Excel files:

1. The system processes each certification in the Excel file
2. For each certification, it looks up the name in the validity map
3. Automatically calculates the correct expiry date and validity type
4. Stores the certification with the calculated values

## API Endpoints

### Get Validity Map
```
GET /api/employees/validity-map
```
Returns the complete validity map and list of certification names.

### Get Validity Statistics
```
GET /api/employees/validity-statistics
```
Returns statistics about certifications including:
- Total certifications
- Breakdown by validity type
- Expiring soon count
- Expired count
- Validity map information

### Validate Certification Name
```
GET /api/employees/validate-certification/:name
```
Validates a certification name and returns:
- Whether it has a validity rule
- Validity type
- Valid years (if applicable)
- Calculated expiry date
- Whether it's a lifetime certification

### Bulk Update Employee Certifications
```
POST /api/employees/bulk-update-employee-certifications
```
Body:
```json
{
  "employeeId": "uuid",
  "validityType": "LIFETIME|FIXED_YEARS|CUSTOM_DATE",
  "validYears": 3
}
```

### Bulk Update Certifications by Name
```
POST /api/employees/bulk-update-certifications-by-name
```
Body:
```json
{
  "certificationName": "First Aid / CPR / AED - Standard/Emergency",
  "validityType": "FIXED_YEARS",
  "validYears": 3
}
```

## Database Schema Changes

The `Certification` model has been updated:

```prisma
model Certification {
  id           String       @id @default(uuid())
  employeeId   String
  name         String
  expiryDate   DateTime?    // Now nullable for lifetime certifications
  validityType ValidityType @default(CUSTOM_DATE)
  validYears   Int?
  employee     Employee     @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}
```

## Usage Examples

### Creating a Certification

```javascript
// The system will automatically determine validity based on the name
const certification = await fetch('/api/employees/certifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeId: 'employee-uuid',
    name: 'First Aid / CPR / AED - Standard/Emergency'
    // No expiryDate needed - system calculates it automatically
  })
});
```

### Updating a Certification Name

```javascript
// When the name changes, validity is automatically recalculated
const updatedCert = await fetch('/api/employees/certifications/cert-uuid', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'WHMIS 2015 - NEW VERSION'
    // System will automatically set validity to 1 year
  })
});
```

### Getting Validity Information

```javascript
// Check what validity rule applies to a certification
const validation = await fetch('/api/employees/validate-certification/First%20Aid%20CPR%20AED%20Standard');
const validityInfo = await validation.json();
// Returns: { hasValidityRule: true, validityType: 'FIXED_YEARS', validYears: 3, isLifetime: false }
```

## Benefits

1. **Automatic Date Calculation**: No need to manually calculate expiry dates
2. **Consistency**: All certifications of the same type have consistent validity periods
3. **Reduced Errors**: Eliminates manual date entry errors
4. **Easy Updates**: Changing validity rules affects all future certifications
5. **Bulk Operations**: Can update multiple certifications at once
6. **Flexibility**: Still supports custom dates when needed

## Migration Notes

- Existing certifications will retain their current expiry dates
- New certifications will use the validity map
- When updating existing certifications, only name changes trigger recalculation
- The `expiryDate` field is now nullable to support lifetime certifications

## Future Enhancements

1. **Admin Interface**: Add UI for managing the validity map
2. **Version Control**: Track changes to validity rules over time
3. **Notifications**: Alert when certifications are approaching expiry
4. **Reporting**: Generate reports based on validity types
5. **Import/Export**: Allow importing validity rules from external sources 