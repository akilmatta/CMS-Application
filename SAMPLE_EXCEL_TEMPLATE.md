# 📊 Sample Excel Template for CMS Application

## 📋 Template Structure

Create an Excel file with the following exact structure:

### **Sheet 1: Employee Certifications**

| A | B | C | D | E |
|---|---|---|---|---|
| **Employee Name** | **AWS Certified Solutions Architect** | **Microsoft Azure Administrator** | **Google Cloud Professional** | **CompTIA Security+** |
| John Doe | 2024-12-31 | 2024-06-15 | | 2024-09-30 |
| Jane Smith | 2024-08-20 | | 2024-11-10 | |
| Mike Johnson | | 2024-05-01 | 2024-07-22 | 2024-10-15 |
| Sarah Wilson | 2024-09-30 | 2024-12-31 | 2024-08-15 | |

## 📝 Step-by-Step Instructions

### **1. Create New Excel File**
- Open Excel or Google Sheets
- Create a new spreadsheet

### **2. Set Up Header Row (Row 1)**
- **Cell A1**: `Employee Name` (or leave empty)
- **Cell B1**: `AWS Certified Solutions Architect`
- **Cell C1**: `Microsoft Azure Administrator`
- **Cell D1**: `Google Cloud Professional`
- **Cell E1**: `CompTIA Security+`
- Add more certification columns as needed

### **3. Add Employee Data (Row 2 onwards)**
- **Column A**: Employee names
- **Column B**: AWS certification expiry date (or leave empty)
- **Column C**: Azure certification expiry date (or leave empty)
- **Column D**: Google Cloud certification expiry date (or leave empty)
- **Column E**: Security+ certification expiry date (or leave empty)

### **4. Date Format**
Use any of these date formats:
- `2024-12-31` (YYYY-MM-DD) - **Recommended**
- `12/31/2024` (MM/DD/YYYY)
- `31/12/2024` (DD/MM/YYYY)
- `December 31, 2024`

### **5. Save File**
- Save as `.xlsx` format
- Name it something like `employee_certifications.xlsx`

## ✅ Example Data

Here's a complete example you can copy:

| Employee Name | AWS Certified Solutions Architect | Microsoft Azure Administrator | Google Cloud Professional | CompTIA Security+ | Cisco CCNA |
|---------------|----------------------------------|------------------------------|---------------------------|-------------------|------------|
| John Doe | 2024-12-31 | 2024-06-15 | | 2024-09-30 | 2024-11-15 |
| Jane Smith | 2024-08-20 | | 2024-11-10 | | 2024-10-01 |
| Mike Johnson | | 2024-05-01 | 2024-07-22 | 2024-10-15 | |
| Sarah Wilson | 2024-09-30 | 2024-12-31 | 2024-08-15 | | 2024-12-01 |
| David Brown | 2024-07-15 | 2024-09-30 | 2024-11-20 | 2024-08-15 | 2024-10-30 |

## 🎯 Key Points

### **What the System Expects:**
1. **Matrix Format**: Each row = one employee, each column = one certification
2. **Header Row**: Contains certification names (starting from column B)
3. **Data Rows**: Contain expiry dates for each certification
4. **Empty Cells**: Leave empty if employee doesn't have that certification

### **What Gets Processed:**
- ✅ Valid employee names (non-empty)
- ✅ Valid dates in any supported format
- ✅ Empty cells (ignored)
- ❌ Invalid dates (ignored)
- ❌ Empty employee names (ignored)

### **Validation Rules:**
- At least one employee with at least one valid certification date
- Employee names cannot be empty
- Dates must be in a recognizable format
- File must be .xlsx or .xls format
- File size must be under 5MB

## 🚀 Upload Process

1. **Prepare your Excel file** following the template above
2. **Go to Employee Management Dashboard** in the CMS application
3. **Click "Upload Excel File"**
4. **Select your file** and upload
5. **Check the results** in the Employee List or Certifications List tabs

## 🔧 Troubleshooting

### **If upload fails:**
1. Check file format (.xlsx or .xls)
2. Verify you have at least one employee with a valid certification date
3. Ensure employee names are not empty
4. Check that dates are in a valid format
5. Make sure file size is under 5MB

### **If data doesn't appear correctly:**
1. Check the header row contains certification names
2. Verify dates are in the correct columns
3. Ensure employee names are in column A
4. Check for any formatting issues in Excel

## 📁 Download Template

You can create your own template by copying the structure above, or use the existing `backend/test-sample.xlsx` file as a reference.

## 💡 Tips

- **Use descriptive certification names** for better organization
- **Keep dates consistent** (use YYYY-MM-DD format)
- **Remove any extra formatting** that might interfere with parsing
- **Test with a small file first** before uploading large datasets
- **Backup your data** before uploading to avoid duplicates 