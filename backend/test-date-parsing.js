const XLSX = require('xlsx');
const fs = require('fs');

function testDateParsing() {
  try {
    // Read the test file
    const buffer = fs.readFileSync('test-sample.xlsx');
    
    // Parse with different options
    console.log('=== Testing Excel Date Parsing ===\n');
    
    // Test 1: Default parsing
    console.log('1. Default parsing:');
    const workbook1 = XLSX.read(buffer, { type: 'buffer' });
    const worksheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
    const jsonData1 = XLSX.utils.sheet_to_json(worksheet1, { header: 1 });
    console.log('Raw data:', jsonData1);
    
    // Test 2: With date parsing
    console.log('\n2. With date parsing:');
    const workbook2 = XLSX.read(buffer, { 
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    const worksheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
    const jsonData2 = XLSX.utils.sheet_to_json(worksheet2, { 
      header: 1,
      raw: false,
      dateNF: 'yyyy-mm-dd'
    });
    console.log('Parsed data:', jsonData2);
    
    // Test 3: Manual date conversion
    console.log('\n3. Manual date conversion:');
    if (jsonData1.length > 1 && jsonData1[1].length > 1) {
      const sampleValue = jsonData1[1][1]; // First data cell
      console.log('Sample value:', sampleValue, 'Type:', typeof sampleValue);
      
      if (typeof sampleValue === 'number') {
        // Excel date conversion
        const excelEpoch = new Date(1900, 0, 1);
        const dateInMs = excelEpoch.getTime() + (sampleValue - 1) * 24 * 60 * 60 * 1000;
        const convertedDate = new Date(dateInMs);
        console.log('Converted date:', convertedDate.toISOString().split('T')[0]);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testDateParsing(); 