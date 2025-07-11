# 🚀 Postman Testing Guide for CMS API

## 📋 Prerequisites

1. **Install Postman** from [postman.com](https://www.postman.com/downloads/)
2. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```
3. **Ensure the server is running** on `http://localhost:5000`

## 🏗️ API Base URL

```
http://localhost:5000/api
```

## 📁 File Upload Testing

### **1. Upload Excel File**

**Method:** `POST`  
**URL:** `http://localhost:5000/api/upload`  
**Headers:**
```
Content-Type: multipart/form-data
```

**Body (form-data):**
- Key: `file`
- Type: `File`
- Value: Select your Excel file (`.xlsx` or `.xls`)

**Steps in Postman:**
1. Create a new request
2. Set method to `POST`
3. Enter URL: `http://localhost:5000/api/upload`
4. Go to **Body** tab
5. Select **form-data**
6. Add key: `file` (Type: File)
7. Click **Select Files** and choose your Excel file
8. Click **Send**

**Expected Response:**
```json
{
  "message": "Successfully parsed X employees",
  "data": [
    {
      "employeeName": "John Doe",
      "certifications": "AWS Certified Solutions Architect (2024-12-31) | Microsoft Azure Administrator (2024-06-15)"
    }
  ],
  "totalEmployees": 1
}
```

## 👥 Employee Management Testing

### **2. Get All Employees**

**Method:** `GET`  
**URL:** `http://localhost:5000/api/employees`

**Expected Response:**
```json
[
  {
    "id": "uuid-here",
    "name": "John Doe",
    "certifications": [
      {
        "id": "cert-uuid",
        "name": "AWS Certified Solutions Architect",
        "expiryDate": "2024-12-31T00:00:00.000Z",
        "employeeId": "uuid-here"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### **3. Create New Employee**

**Method:** `POST`  
**URL:** `http://localhost:5000/api/employees`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Jane Smith"
}
```

**Expected Response:**
```json
{
  "id": "uuid-here",
  "name": "Jane Smith",
  "certifications": [],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### **4. Delete Employee**

**Method:** `DELETE`  
**URL:** `http://localhost:5000/api/employees/{employee-id}`

**Expected Response:**
```json
{
  "message": "Employee deleted successfully"
}
```

## 📜 Certification Management Testing

### **5. Add Certification to Employee**

**Method:** `POST`  
**URL:** `http://localhost:5000/api/certifications`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "employeeId": "employee-uuid-here",
  "name": "AWS Certified Solutions Architect",
  "expiryDate": "2024-12-31"
}
```

**Expected Response:**
```json
{
  "id": "cert-uuid",
  "employeeId": "employee-uuid-here",
  "name": "AWS Certified Solutions Architect",
  "expiryDate": "2024-12-31T00:00:00.000Z",
  "employee": {
    "id": "employee-uuid-here",
    "name": "John Doe"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### **6. Update Certification**

**Method:** `PUT`  
**URL:** `http://localhost:5000/api/certifications/{certification-id}`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Updated Certification Name",
  "expiryDate": "2025-06-15"
}
```

**Expected Response:**
```json
{
  "id": "cert-uuid",
  "employeeId": "employee-uuid-here",
  "name": "Updated Certification Name",
  "expiryDate": "2025-06-15T00:00:00.000Z",
  "employee": {
    "id": "employee-uuid-here",
    "name": "John Doe"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### **7. Delete Certification**

**Method:** `DELETE`  
**URL:** `http://localhost:5000/api/certifications/{certification-id}`

**Expected Response:**
```json
{
  "message": "Certification deleted successfully"
}
```

## 🏥 Health Check

### **8. Health Check**

**Method:** `GET`  
**URL:** `http://localhost:5000/health`

**Expected Response:**
```json
{
  "status": "OK",
  "message": "CMS API is running"
}
```

## 📊 Complete Testing Workflow

### **Step-by-Step Testing Process:**

1. **Health Check**
   - Test: `GET /health`
   - Verify server is running

2. **Upload Excel File**
   - Test: `POST /api/upload`
   - Upload your Excel file
   - Verify parsing results

3. **Get Employees**
   - Test: `GET /api/employees`
   - Verify employees were created from Excel

4. **Create Employee**
   - Test: `POST /api/employees`
   - Add a new employee manually

5. **Add Certification**
   - Test: `POST /api/certifications`
   - Add certification to the new employee

6. **Update Certification**
   - Test: `PUT /api/certifications/{id}`
   - Update certification details

7. **Delete Certification**
   - Test: `DELETE /api/certifications/{id}`
   - Remove a certification

8. **Delete Employee**
   - Test: `DELETE /api/employees/{id}`
   - Remove an employee

## 🔧 Postman Collection Setup

### **Create a Collection:**

1. **Open Postman**
2. **Click "New" → "Collection"**
3. **Name it:** `CMS API Testing`
4. **Add requests for each endpoint**

### **Environment Variables:**

Create an environment with these variables:
```
BASE_URL: http://localhost:5000
API_URL: http://localhost:5000/api
```

### **Sample Collection Structure:**

```
CMS API Testing/
├── Health Check
├── Upload Excel File
├── Employee Management/
│   ├── Get All Employees
│   ├── Create Employee
│   └── Delete Employee
└── Certification Management/
    ├── Add Certification
    ├── Update Certification
    └── Delete Certification
```

## 📁 Excel File for Testing

Create a test Excel file with this structure:

| Employee Name | AWS Certified Solutions Architect | Microsoft Azure Administrator |
|---------------|----------------------------------|------------------------------|
| John Doe      | 2024-12-31                      | 2024-06-15                  |
| Jane Smith    | 2024-08-20                      |                              |

Save as `test-employees.xlsx`

## 🚨 Common Issues & Solutions

### **1. "No file uploaded"**
- **Cause:** Missing file in request
- **Solution:** Ensure you're using `form-data` with key `file`

### **2. "Only Excel files (.xlsx, .xls) are allowed"**
- **Cause:** Wrong file format
- **Solution:** Use `.xlsx` or `.xls` files only

### **3. "No valid data found in Excel file"**
- **Cause:** Invalid Excel structure
- **Solution:** Follow the matrix format with employee names in column A

### **4. "Employee not found"**
- **Cause:** Invalid employee ID
- **Solution:** Use valid UUID from GET /api/employees response

### **5. "Invalid date format"**
- **Cause:** Unrecognized date format
- **Solution:** Use YYYY-MM-DD format for best compatibility

## 📈 Testing Tips

### **1. Use Environment Variables**
```javascript
// In Pre-request Script
pm.environment.set("employeeId", pm.response.json()[0].id);
pm.environment.set("certificationId", pm.response.json()[0].certifications[0].id);
```

### **2. Test Error Cases**
- Try uploading non-Excel files
- Test with invalid date formats
- Test with empty employee names
- Test with missing required fields

### **3. Verify Database State**
- After each operation, call `GET /api/employees`
- Verify the changes were persisted
- Check that relationships are maintained

### **4. Test File Size Limits**
- Try uploading files larger than 5MB
- Verify the size limit is enforced

## 🎯 Quick Test Checklist

- [ ] Health check returns OK
- [ ] Excel file upload works
- [ ] Employees are created from Excel
- [ ] Manual employee creation works
- [ ] Certification addition works
- [ ] Certification update works
- [ ] Certification deletion works
- [ ] Employee deletion works
- [ ] Error handling works for invalid inputs

## 📞 Troubleshooting

If you encounter issues:

1. **Check server logs** in the backend terminal
2. **Verify database connection** (PostgreSQL running)
3. **Check file format** (must be .xlsx or .xls)
4. **Validate Excel structure** (matrix format)
5. **Ensure all required fields** are provided
6. **Check network connectivity** to localhost:5000 