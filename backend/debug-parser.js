const XLSX = require('xlsx');
const fs = require('fs');

// Helper function to parse Excel dates
function parseExcelDate(value) {
  if (!value) return null;
  
  // If it's a Date object, return it
  if (value instanceof Date) {
    return value;
  }
  
  // If it's a number (Excel date number), convert it
  if (typeof value === 'number') {
    // Excel dates are days since 1900-01-01
    // Convert to milliseconds and create date
    const excelEpoch = new Date(1900, 0, 1); // 1900-01-01
    const dateInMs = excelEpoch.getTime() + (value - 1) * 24 * 60 * 60 * 1000;
    return new Date(dateInMs);
  }
  
  // If it's a string, try to parse it
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (!trimmedValue) return null;
    
    // Try different date formats
    const formats = [
      'YYYY-MM-DD',
      'MM/DD/YYYY',
      'DD/MM/YYYY',
      'YYYY/MM/DD',
      'MM-DD-YYYY',
      'DD-MM-YYYY',
      'YYYY.MM.DD',
      'MM.DD.YYYY',
      'DD.MM.YYYY'
    ];
    
    // For now, try simple parsing
    const parsed = new Date(trimmedValue);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  return null;
}

function parseExcelFile(buffer) {
  try {
    const workbook = XLSX.read(buffer, { 
      type: 'buffer',
      cellDates: true, // This tells XLSX to parse dates as Date objects
      cellNF: false,
      cellText: false
    });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with date parsing
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      raw: false, // This ensures dates are parsed as Date objects
      dateNF: 'yyyy-mm-dd' // Date number format
    });
    
    console.log('Raw Excel data:', jsonData);
    
    if (jsonData.length < 2) {
      throw new Error('Excel file must have at least a header row and one data row');
    }
    
    // Row 0 contains certification names (starting from column B)
    const certificationNames = jsonData[0].slice(1); // Skip column A
    
    // Process each row starting from row 1
    const normalizedEmployees = [];
    
    for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
      const row = jsonData[rowIndex];
      if (!row || row.length === 0) continue;
      
      const employeeName = String(row[0] || '').trim();
      if (!employeeName) continue;
      
      console.log(`Processing employee: ${employeeName}`);
      
      const certifications = [];
      
      // Process each certification column (starting from column B)
      for (let colIndex = 1; colIndex < row.length && colIndex - 1 < certificationNames.length; colIndex++) {
        const certificationName = String(certificationNames[colIndex - 1] || '').trim();
        const expiryDateValue = row[colIndex];
        
        if (!certificationName) continue;
        
        console.log(`  Certification: ${certificationName}, Raw value: ${expiryDateValue}, Type: ${typeof expiryDateValue}`);
        
        // Parse and validate the expiry date
        const expiryDate = parseExcelDate(expiryDateValue);
        
        if (expiryDate && !isNaN(expiryDate.getTime())) {
          const formattedDate = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          console.log(`    Parsed date: ${formattedDate}`);
          certifications.push(`${certificationName} (${formattedDate})`);
        } else {
          console.log(`    Invalid date for ${certificationName}: ${expiryDateValue}`);
        }
      }
      
      // Only add employee if they have at least one valid certification
      if (certifications.length > 0) {
        normalizedEmployees.push({
          employeeName,
          certifications: certifications.join(' | ')
        });
        console.log(`  Employee ${employeeName} has ${certifications.length} certifications`);
      } else {
        console.log(`  Employee ${employeeName} has no valid certifications`);
      }
    }
    
    console.log('Final normalized employees:', normalizedEmployees);
    return normalizedEmployees;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error('Failed to parse Excel file');
  }
}

// Test the parsing
const buffer = fs.readFileSync('test-sample.xlsx');
const result = parseExcelFile(buffer);

console.log('✅ Parsing successful!');
console.log('📊 Results:');
console.log(JSON.stringify(result, null, 2)); 