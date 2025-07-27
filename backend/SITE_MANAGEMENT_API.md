# Site Management API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently, the API doesn't require authentication. In production, you should implement proper authentication using the `firebaseUid` field in the Employee model.

## Endpoints

### 1. Get All Sites
**GET** `/sites`

Returns a list of all sites with their employees and checklists.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Site Name",
    "location": "Site Location",
    "employees": [
      {
        "id": "uuid",
        "assignedAt": "2024-01-01T00:00:00.000Z",
        "employee": {
          "id": "uuid",
          "name": "Employee Name",
          "email": "employee@example.com",
          "role": "SUPERVISOR"
        }
      }
    ],
    "checklists": [
      {
        "id": "uuid",
        "type": "Safety",
        "status": "PENDING",
        "completedAt": null,
        "fileUrl": null,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "employee": {
          "id": "uuid",
          "name": "Employee Name",
          "email": "employee@example.com"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 2. Create Site
**POST** `/sites`

Creates a new site.

**Request Body:**
```json
{
  "name": "Site Name",
  "location": "Site Location"
}
```

**Response:** Returns the created site with employees and checklists arrays (initially empty).

### 3. Get Site by ID
**GET** `/sites/:id`

Returns details of a specific site including employees and checklists.

**Response:** Same structure as Get All Sites, but for a single site.

### 4. Delete Site
**DELETE** `/sites/:id`

Deletes a site and all related employee assignments and checklists.

**Response:**
```json
{
  "message": "Site deleted successfully"
}
```

### 5. Assign Employee to Site
**POST** `/sites/:id/employees`

Assigns an employee to a specific site.

**Request Body:**
```json
{
  "employeeId": "employee-uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "siteId": "site-uuid",
  "employeeId": "employee-uuid",
  "assignedAt": "2024-01-01T00:00:00.000Z",
  "site": {
    "id": "site-uuid",
    "name": "Site Name",
    "location": "Site Location"
  },
  "employee": {
    "id": "employee-uuid",
    "name": "Employee Name",
    "email": "employee@example.com",
    "role": "SUPERVISOR"
  }
}
```

### 6. Remove Employee from Site
**DELETE** `/sites/:id/employees/:employeeId`

Removes an employee assignment from a site.

**Response:**
```json
{
  "message": "Employee removed from site successfully"
}
```

### 7. Create Checklist
**POST** `/sites/:id/checklists`

Creates a new checklist for a site. The employee must be assigned to the site.

**Request Body:**
```json
{
  "employeeId": "employee-uuid",
  "type": "Safety"
}
```

**Response:**
```json
{
  "id": "uuid",
  "siteId": "site-uuid",
  "employeeId": "employee-uuid",
  "type": "Safety",
  "status": "PENDING",
  "completedAt": null,
  "fileUrl": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "site": {
    "id": "site-uuid",
    "name": "Site Name",
    "location": "Site Location"
  },
  "employee": {
    "id": "employee-uuid",
    "name": "Employee Name",
    "email": "employee@example.com",
    "role": "SUPERVISOR"
  }
}
```

### 8. Get Site Checklists
**GET** `/sites/:id/checklists`

Returns all checklists for a specific site.

**Response:**
```json
[
  {
    "id": "uuid",
    "siteId": "site-uuid",
    "employeeId": "employee-uuid",
    "type": "Safety",
    "status": "COMPLETED",
    "completedAt": "2024-01-01T00:00:00.000Z",
    "fileUrl": "https://example.com/file.pdf",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "employee": {
      "id": "employee-uuid",
      "name": "Employee Name",
      "email": "employee@example.com",
      "role": "SUPERVISOR"
    }
  }
]
```

### 9. Update Checklist Status
**PUT** `/checklists/:id`

Updates the status of a checklist and optionally adds a file URL.

**Request Body:**
```json
{
  "status": "COMPLETED",
  "fileUrl": "https://example.com/file.pdf"
}
```

**Response:** Returns the updated checklist with site and employee information.

## Error Responses

All endpoints return appropriate HTTP status codes:

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation errors)
- **404** - Not Found
- **500** - Internal Server Error

Error response format:
```json
{
  "error": "Error message description"
}
```

## Data Models

### Role Enum
```typescript
enum Role {
  HEAD_OFFICE
  SUPERVISOR
  FOREMAN
  HSE
  ELECTRICAL
}
```

### ChecklistStatus Enum
```typescript
enum ChecklistStatus {
  PENDING
  COMPLETED
}
```

## Example Usage

### Creating a Site and Assigning Employees

1. Create a site:
```bash
curl -X POST http://localhost:5000/api/sites \
  -H "Content-Type: application/json" \
  -d '{"name": "Downtown Project", "location": "123 Main St"}'
```

2. Assign an employee (requires existing employee):
```bash
curl -X POST http://localhost:5000/api/sites/{site-id}/employees \
  -H "Content-Type: application/json" \
  -d '{"employeeId": "employee-uuid"}'
```

3. Create a checklist:
```bash
curl -X POST http://localhost:5000/api/sites/{site-id}/checklists \
  -H "Content-Type: application/json" \
  -d '{"employeeId": "employee-uuid", "type": "Safety Inspection"}'
```

4. Update checklist status:
```bash
curl -X PUT http://localhost:5000/api/checklists/{checklist-id} \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED", "fileUrl": "https://example.com/report.pdf"}'
``` 