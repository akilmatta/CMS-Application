# Site Management Module

A comprehensive site management system for the CMS application, built with TypeScript, Express, and Prisma.

## Features

- ✅ **Site Management**: Create, read, update, and delete construction sites
- ✅ **Employee Assignment**: Assign and remove employees from sites
- ✅ **Checklist Management**: Create and track site-specific checklists
- ✅ **Role-Based System**: Support for different employee roles (HEAD_OFFICE, SUPERVISOR, FOREMAN, HSE, ELECTRICAL)
- ✅ **Status Tracking**: Track checklist completion status with file attachments
- ✅ **RESTful API**: Complete REST API with proper error handling

## Database Models

### Site
- `id`: Unique identifier
- `name`: Site name
- `location`: Site location
- `employees`: Related employee assignments
- `checklists`: Related checklists
- `createdAt` / `updatedAt`: Timestamps

### SiteEmployee (Junction Table)
- `id`: Unique identifier
- `siteId`: Reference to site
- `employeeId`: Reference to employee
- `assignedAt`: Assignment timestamp

### Checklist
- `id`: Unique identifier
- `siteId`: Reference to site
- `employeeId`: Reference to employee
- `type`: Checklist type (e.g., "Safety", "Daily Log")
- `status`: PENDING or COMPLETED
- `completedAt`: Completion timestamp
- `fileUrl`: Optional file attachment URL
- `createdAt` / `updatedAt`: Timestamps

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sites` | Get all sites |
| POST | `/api/sites` | Create a new site |
| GET | `/api/sites/:id` | Get site details |
| DELETE | `/api/sites/:id` | Delete a site |
| POST | `/api/sites/:id/employees` | Assign employee to site |
| DELETE | `/api/sites/:id/employees/:employeeId` | Remove employee from site |
| POST | `/api/sites/:id/checklists` | Create checklist for site |
| GET | `/api/sites/:id/checklists` | Get site checklists |
| PUT | `/api/checklists/:id` | Update checklist status |

## Setup Instructions

### 1. Database Setup
The database models are already included in the Prisma schema. Make sure migrations are applied:

```bash
cd backend
npx prisma migrate dev
```

### 2. Start the Server
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 3. Test the API
Use the provided test script:
```bash
node test-site-api.js
```

Or use the comprehensive API documentation in `SITE_MANAGEMENT_API.md`

## Usage Examples

### Creating a Site
```javascript
const response = await fetch('http://localhost:5000/api/sites', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Downtown Construction Project',
    location: '123 Main Street, Downtown'
  })
});
```

### Assigning an Employee
```javascript
const response = await fetch(`http://localhost:5000/api/sites/${siteId}/employees`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeId: 'employee-uuid'
  })
});
```

### Creating a Checklist
```javascript
const response = await fetch(`http://localhost:5000/api/sites/${siteId}/checklists`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeId: 'employee-uuid',
    type: 'Safety Inspection'
  })
});
```

## File Structure

```
backend/src/
├── controllers/
│   └── site.controller.ts    # Site management logic
├── routes/
│   └── site.routes.ts        # API route definitions
├── prisma/
│   └── client.ts             # Prisma client
└── app.ts                    # Main application file
```

## Error Handling

The API includes comprehensive error handling:

- **Validation Errors**: 400 Bad Request for invalid input
- **Not Found Errors**: 404 for missing resources
- **Server Errors**: 500 for internal errors
- **Business Logic Errors**: Appropriate error messages for business rules

## Security Considerations

- Input validation on all endpoints
- SQL injection protection via Prisma ORM
- CORS enabled for frontend integration
- Ready for authentication integration with Firebase UID

## Next Steps

1. **Frontend Integration**: Create React components for site management
2. **Authentication**: Implement Firebase authentication
3. **File Upload**: Add file upload functionality for checklist attachments
4. **Notifications**: Add real-time notifications for checklist updates
5. **Reporting**: Create site and checklist reports
6. **Mobile App**: Consider mobile app for field workers

## Dependencies

- Express.js - Web framework
- Prisma - Database ORM
- TypeScript - Type safety
- PostgreSQL - Database

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include TypeScript types
4. Test all endpoints
5. Update documentation 