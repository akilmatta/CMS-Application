# Sample Excel Data for Testing

Create an Excel file with the following data to test the application:

## Sample Data

| Employee Name | Certification Name | Expiry Date |
|---------------|-------------------|-------------|
| John Doe      | AWS Solutions Architect | 2024-12-31 |
| Jane Smith    | Azure Administrator | 2024-06-15 |
| Mike Johnson  | Google Cloud Professional | 2024-03-20 |
| Sarah Wilson  | AWS Developer Associate | 2024-08-10 |
| David Brown   | Azure Solutions Architect | 2024-01-15 |
| Lisa Davis    | Google Cloud Architect | 2024-11-30 |

## Instructions

1. Open Excel or Google Sheets
2. Create a new spreadsheet
3. Add the headers in row 1: "Employee Name", "Certification Name", "Expiry Date"
4. Add the sample data starting from row 2
5. Save as `.xlsx` format
6. Upload the file through the Employee Management page

## Expected Results

After uploading:
- 6 employees will be created
- 6 certifications will be added
- The table will show color-coded status:
  - Red: Expired certifications (past due date)
  - Yellow: Expiring within 30 days
  - Green: Valid certifications (more than 30 days remaining)

## Testing Inline Editing

1. Click "Edit" on any certification row
2. Change the expiry date
3. Click "Save" to update the database
4. The status color should update accordingly 