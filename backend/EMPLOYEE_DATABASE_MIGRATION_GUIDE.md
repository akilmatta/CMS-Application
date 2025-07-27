# Employee Database Migration Guide

This guide explains how to handle the new Employee table fields (email, role, firebaseUid) while maintaining backward compatibility with existing employee management functionality.

## Database Changes

The Employee table now requires these additional fields:
- `email` (String, unique) - Employee email address
- `role` (Role enum) - Employee role (HEAD_OFFICE, SUPERVISOR, FOREMAN, HSE, ELECTRICAL)
- `firebaseUid` (String, unique) - Firebase authentication UID

## Migration Steps

### 1. Run Database Migration
```bash
cd backend
npx prisma migrate dev --name update_employee_model_fields
```

### 2. Update Existing Employees
Run the migration script to update existing employees with default values:
```bash
npm run update:employees
```

This script will:
- Generate email addresses for employees without emails
- Set default role as 'FOREMAN' for employees without roles
- Generate temporary firebaseUid for employees without UIDs

### 3. Verify Migration
Check that all employees have the required fields:
```bash
npx prisma studio
```

## Backward Compatibility

### Backend Changes Made

1. **Employee Creation (Excel Upload)**
   - Automatically generates email from employee name
   - Sets default role as 'FOREMAN'
   - Generates temporary firebaseUid

2. **Employee Creation (API)**
   - Accepts optional email and role parameters
   - Generates defaults if not provided
   - Always generates firebaseUid

3. **Existing API Endpoints**
   - All existing endpoints continue to work
   - No breaking changes to API responses
   - New fields are included in responses

### Frontend Changes Made

1. **Employee Interface**
   - Updated to include new fields
   - Maintains backward compatibility
   - Gracefully handles missing fields

2. **API Integration**
   - Updated createEmployee function to accept optional parameters
   - No changes to existing functionality
   - New fields are displayed when available

## Default Values

When creating employees without specifying the new fields:

- **Email**: `{name.toLowerCase().replace(/\s+/g, '.')}@company.com`
- **Role**: `FOREMAN`
- **firebaseUid**: `temp_{timestamp}_{randomString}`

## Testing

### 1. Test Existing Functionality
```bash
# Start the backend
npm run dev

# Test employee creation
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe"}'

# Test Excel upload
# Upload an existing Excel file to ensure it works
```

### 2. Test New Functionality
```bash
# Test employee creation with new fields
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Smith", "email": "jane.smith@company.com", "role": "SUPERVISOR"}'
```

### 3. Test Frontend
- Navigate to Employee Management
- Create new employees
- Upload Excel files
- Verify all functionality works as before

## Troubleshooting

### Common Issues

1. **Migration Fails**
   ```bash
   # Reset database if needed
   npx prisma migrate reset
   npx prisma migrate dev
   ```

2. **Existing Employees Missing Fields**
   ```bash
   # Run the update script
   npm run update:employees
   ```

3. **Frontend Errors**
   - Clear browser cache
   - Restart frontend development server
   - Check browser console for errors

### Error Messages

- **"Required field missing"**: Run the update script
- **"Unique constraint violation"**: Check for duplicate emails or firebaseUids
- **"Invalid role"**: Ensure role is one of the valid enum values

## Future Considerations

1. **Firebase Integration**
   - Replace temporary firebaseUids with real Firebase UIDs
   - Implement proper authentication flow

2. **Email Validation**
   - Add email format validation
   - Implement email uniqueness checks

3. **Role Management**
   - Add role-based access control
   - Implement role hierarchy

4. **Data Cleanup**
   - Remove temporary firebaseUids
   - Update email addresses to real ones

## Rollback Plan

If issues arise, you can rollback by:

1. **Database Rollback**
   ```bash
   npx prisma migrate reset
   ```

2. **Code Rollback**
   - Revert the Employee model changes
   - Revert controller changes
   - Revert frontend interface changes

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the migration logs
3. Test with a fresh database
4. Contact the development team 