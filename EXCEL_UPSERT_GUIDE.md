# 🔄 Excel Upload Upsert Guide

## 🎯 **What is Upsert?**

**Upsert** = **Update** + **Insert**
- If an employee exists → **Update** their certifications
- If an employee doesn't exist → **Insert** new employee with certifications
- If a certification exists → **Update** expiry date
- If a certification doesn't exist → **Insert** new certification
- If a certification is not in Excel → **Remove** it from database

## 🔄 **How It Works**

### **1. Employee Processing**
```javascript
// Check if employee exists
let employee = await prisma.employee.findFirst({
  where: { name: normalizedEmployee.employeeName }
});

if (employee) {
  // Update existing employee
  updatedCount++;
} else {
  // Create new employee
  employee = await prisma.employee.create({
    data: { name: normalizedEmployee.employeeName }
  });
  createdCount++;
}
```

### **2. Certification Processing**
```javascript
// For each certification in Excel
for (const certification of certifications) {
  const existingCert = employee.certifications.find(
    cert => cert.name === certName
  );
  
  if (existingCert) {
    // Update existing certification
    await prisma.certification.update({
      where: { id: existingCert.id },
      data: { expiryDate: newDate }
    });
  } else {
    // Create new certification
    await prisma.certification.create({
      data: {
        employeeId: employee.id,
        name: certName,
        expiryDate: newDate
      }
    });
  }
}
```

### **3. Certification Cleanup**
```javascript
// Remove certifications not in Excel
const certificationsToRemove = employee.certifications.filter(
  cert => !processedCertNames.has(cert.name)
);

for (const certToRemove of certificationsToRemove) {
  await prisma.certification.delete({
    where: { id: certToRemove.id }
  });
}
```

## 📊 **Upload Results**

### **Response Format:**
```json
{
  "message": "Successfully processed 3 employees (1 created, 2 updated)",
  "data": [...],
  "totalEmployees": 3,
  "created": 1,
  "updated": 2
}
```

### **Frontend Display:**
- Shows how many employees were created vs updated
- Displays detailed success message
- Updates the UI with new data

## 🎯 **Use Cases**

### **1. First Upload**
- **Excel**: John Doe with AWS Cert (2024-12-31)
- **Result**: Creates John Doe + AWS Cert
- **Message**: "Successfully processed 1 employees (1 created, 0 updated)"

### **2. Update Existing Employee**
- **Excel**: John Doe with AWS Cert (2025-06-15) + Azure Cert (2024-08-20)
- **Result**: Updates John Doe's AWS Cert + Adds Azure Cert
- **Message**: "Successfully processed 1 employees (0 created, 1 updated)"

### **3. Remove Certification**
- **Excel**: John Doe with AWS Cert (2025-06-15) [Azure Cert removed]
- **Result**: Updates AWS Cert + Removes Azure Cert
- **Message**: "Successfully processed 1 employees (0 created, 1 updated)"

### **4. Multiple Employees**
- **Excel**: John Doe + Jane Smith + Mike Johnson
- **Result**: Updates existing + Creates new
- **Message**: "Successfully processed 3 employees (1 created, 2 updated)"

## 🔍 **Logging and Debugging**

### **Backend Logs:**
```
Processing employee: John Doe
Employee exists, updating: uuid-here
Certifications to process: ["AWS Certified Solutions Architect (2024-12-31)", "Azure Administrator (2024-06-15)"]
Processing certification: AWS Certified Solutions Architect, expires: 2024-12-31
Updating existing certification: cert-uuid-1
Processing certification: Azure Administrator, expires: 2024-06-15
Creating new certification
Removing certifications not in Excel: ["Old Certification"]
Total employees processed: 1
Created: 0, Updated: 1
```

### **Frontend Console:**
```
Uploading file: employees.xlsx 12345 application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Sending request to /api/upload
Upload response: {message: "Successfully processed 3 employees (1 created, 2 updated)", ...}
```

## ✅ **Benefits**

### **1. No Duplicates**
- ✅ Employees are not duplicated
- ✅ Certifications are not duplicated
- ✅ Data integrity maintained

### **2. Incremental Updates**
- ✅ Only changed data is updated
- ✅ Performance optimized
- ✅ Minimal database operations

### **3. Data Cleanup**
- ✅ Removes outdated certifications
- ✅ Keeps database clean
- ✅ Reflects current Excel state

### **4. Audit Trail**
- ✅ Shows what was created vs updated
- ✅ Detailed logging for debugging
- ✅ Clear success messages

## 🚨 **Important Notes**

### **1. Employee Matching**
- **Exact name match** required
- **Case-sensitive** comparison
- **No fuzzy matching** (John Doe ≠ John D.)

### **2. Certification Matching**
- **Exact name match** required
- **Case-sensitive** comparison
- **No fuzzy matching** (AWS Cert ≠ AWS Certification)

### **3. Data Loss Prevention**
- **Backup before upload** if needed
- **Test with small files** first
- **Check logs** for processing details

### **4. Performance**
- **Batch processing** for large files
- **Database transactions** for consistency
- **Error handling** for failed operations

## 🧪 **Testing Scenarios**

### **Test 1: First Upload**
1. Upload Excel with new employees
2. Verify all created
3. Check database records

### **Test 2: Update Existing**
1. Modify Excel file
2. Upload again
3. Verify updates only

### **Test 3: Remove Certifications**
1. Remove certifications from Excel
2. Upload again
3. Verify certifications removed

### **Test 4: Mixed Operations**
1. Add new employees + Update existing + Remove certifications
2. Upload Excel
3. Verify all operations correct

## 🔧 **Troubleshooting**

### **Issue: Duplicate Employees**
- **Check**: Employee name matching
- **Solution**: Ensure exact name match

### **Issue: Duplicate Certifications**
- **Check**: Certification name matching
- **Solution**: Ensure exact name match

### **Issue: Certifications Not Removed**
- **Check**: Excel file structure
- **Solution**: Verify certification names match exactly

### **Issue: Performance Issues**
- **Check**: File size and complexity
- **Solution**: Process in smaller batches if needed 