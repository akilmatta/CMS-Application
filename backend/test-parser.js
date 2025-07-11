const XLSX = require('xlsx');
const fs = require('fs');

// Create sample Excel data in the new format
const sampleData = [
  ['Employee Name', 'AWS Certified', 'Azure Certified', 'GCP Certified', 'PMP Certified'],
  ['John Doe', '2024-12-31', '2024-06-15', '', '2024-08-20'],
  ['Jane Smith', '2024-03-01', '2024-09-30', '2024-11-15', ''],
  ['Bob Johnson', '', '2024-07-22', '2024-05-10', '2024-12-01'],
  ['Alice Brown', '2024-04-15', '', '', '2024-10-31']
];

// Create workbook and worksheet
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(sampleData);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

// Write to file
XLSX.writeFile(workbook, 'test-sample.xlsx');

console.log('✅ Test Excel file created: test-sample.xlsx');
console.log('\n📋 Sample data structure:');
console.log('- Row 0: Certification names (AWS Certified, Azure Certified, etc.)');
console.log('- Column A: Employee names');
console.log('- Data cells: Expiry dates in YYYY-MM-DD format');
console.log('- Empty cells: No certification for that employee');
console.log('\n🚀 You can now test the upload endpoint with this file!'); 