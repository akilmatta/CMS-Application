# Certification Validity Update Guide

This guide explains how to use the TypeScript scripts to update validity information for certifications in your PostgreSQL database using Prisma Client.

## Overview

The certification validity system supports three types of validity:

- **LIFETIME**: Certifications that never expire (set to year 2099)
- **FIXED_YEARS**: Certifications that expire after a specific number of years from the current date
- **CUSTOM_DATE**: Certifications that expire on a specific date

## Setup

### 1. Update Prisma Schema

The schema has been updated to include the new validity fields:

```prisma
enum ValidityType {
  LIFETIME
  FIXED_YEARS
  CUSTOM_DATE
}

model Certification {
  id           String       @id @default(uuid())
  employeeId   String
  name         String
  expiryDate   DateTime
  validityType ValidityType @default(CUSTOM_DATE)
  validYears   Int?
  employee     Employee     @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}
```

### 2. Run Database Migration

```bash
# Navigate to backend directory
cd backend

# Run the setup script
npm run setup:validity
```

This script will:
- Generate the Prisma client with new schema
- Run database migration
- Test the database connection
- Show sample data structure

## Usage

### Main Script: `updateCertificationValidity.ts`

The main script provides a `CertificationValidityUpdater` class with the following methods:

#### Single Certification Updates

```typescript
import { CertificationValidityUpdater } from './src/utils/updateCertificationValidity'

const updater = new CertificationValidityUpdater()

// Update a single certification
await updater.updateSingleCertification({
  id: 'certification-id',
  validityType: 'FIXED_YEARS',
  validYears: 3
})
```

#### Bulk Updates

```typescript
// Update all certifications with a specific name
await updater.updateCertificationsByName(
  'Safety Training',
  'LIFETIME'
)

// Update all certifications for a specific employee
await updater.updateEmployeeCertifications(
  'employee-id',
  'CUSTOM_DATE',
  undefined,
  new Date('2025-12-31')
)
```

#### Convenience Methods

```typescript
// Set certifications to lifetime validity
await updater.setLifetimeValidity(['cert-id-1', 'cert-id-2'])

// Set certifications to fixed years validity
await updater.setFixedYearsValidity(2, ['cert-id-1', 'cert-id-2'])

// Set certifications to custom date validity
await updater.setCustomDateValidity(new Date('2025-06-30'), ['cert-id-1'])
```

#### Statistics

```typescript
// Get certification statistics
const stats = await updater.getCertificationStats()
console.log(stats)
// Output:
// {
//   total: 150,
//   byValidityType: {
//     LIFETIME: 50,
//     FIXED_YEARS: 75,
//     CUSTOM_DATE: 25
//   },
//   expiringSoon: 10,
//   expired: 5
// }
```

### Example Script: `update-certification-examples.ts`

Run comprehensive examples:

```bash
# Run all examples
npm run update:certifications

# Run specific commands
npm run update:certifications lifetime "Safety Training"
npm run update:certifications fixed-years 3 "First Aid"
npm run update:certifications custom-date "2025-12-31" "CPR Certification"
npm run update:certifications employee "employee-id" "FIXED_YEARS" 2
npm run update:certifications stats
```

## Command Line Usage

### Available Commands

1. **lifetime [certification-name]**
   - Sets all certifications with the specified name to lifetime validity
   - Example: `npm run update:certifications lifetime "Safety Training"`

2. **fixed-years [years] [cert-name]**
   - Sets certifications to expire after specified years
   - Example: `npm run update:certifications fixed-years 3 "First Aid"`

3. **custom-date [date] [cert-name]**
   - Sets certifications to expire on a specific date
   - Example: `npm run update:certifications custom-date "2025-12-31" "CPR Certification"`

4. **employee [employee-id] [type] [years]**
   - Updates all certifications for a specific employee
   - Example: `npm run update:certifications employee "emp-123" "FIXED_YEARS" 2`

5. **stats**
   - Shows current certification statistics
   - Example: `npm run update:certifications stats`

6. **examples**
   - Runs all example scenarios
   - Example: `npm run update:certifications examples`

## Validity Type Behavior

### LIFETIME
- Sets `expiryDate` to `2099-12-31`
- Sets `validYears` to `null`
- Certifications never expire

### FIXED_YEARS
- Calculates new `expiryDate` as current date + specified years
- Sets `validYears` to the specified number
- Example: If set to 3 years on 2024-01-15, expires on 2027-01-15

### CUSTOM_DATE
- Sets `expiryDate` to the specified date
- Keeps `validYears` as `null`
- Allows precise control over expiry dates

## Error Handling

The scripts include comprehensive error handling:

- Database connection errors
- Invalid certification IDs
- Missing required parameters
- Validation of date formats
- Transaction rollback on errors

## Best Practices

1. **Always backup your database** before running bulk updates
2. **Test with a small subset** of data first
3. **Use specific certification names** rather than updating all certifications
4. **Check statistics** before and after updates
5. **Use transactions** for critical updates (implemented in the class)

## Integration with Frontend

The updated schema and validity information can be used in your frontend to:

- Display validity type indicators
- Show remaining validity time
- Filter certifications by validity type
- Generate reports on certification status

## Troubleshooting

### Common Issues

1. **"Module '@prisma/client' has no exported member 'ValidityType'"**
   - Run `npm run setup:validity` to regenerate Prisma client
   - Update import statement to use the generated enum

2. **Database migration fails**
   - Check your database connection
   - Ensure you have proper permissions
   - Verify the DATABASE_URL environment variable

3. **No certifications updated**
   - Check if certification names match exactly (case-sensitive)
   - Verify employee IDs exist in the database
   - Use the `stats` command to see current data

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG=prisma:* npm run update:certifications
```

## API Integration

The validity information can be exposed through your API endpoints:

```typescript
// Example API endpoint
app.get('/api/certifications/:id', async (req, res) => {
  const certification = await prisma.certification.findUnique({
    where: { id: req.params.id },
    include: { employee: true }
  })
  
  // Calculate remaining validity
  const now = new Date()
  const remainingDays = Math.ceil(
    (certification.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  res.json({
    ...certification,
    remainingDays,
    isExpired: remainingDays < 0,
    isExpiringSoon: remainingDays <= 30 && remainingDays >= 0
  })
})
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the example scripts
3. Test with the provided command-line interface
4. Verify database schema matches the expected structure 