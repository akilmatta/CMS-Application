const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testChecklistUpload() {
  try {
    console.log('🧪 Testing Checklist PDF Upload...\n');

    // Create a simple test PDF (or use an existing one)
    const testPdfPath = './test-sample.pdf';
    
    // Check if test PDF exists, if not create a simple one
    if (!fs.existsSync(testPdfPath)) {
      console.log('Creating test PDF file...');
      // Create a minimal PDF content (this is just for testing)
      const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF';
      fs.writeFileSync(testPdfPath, pdfContent);
    }

    // Test 1: Get all checklist PDFs (should work)
    console.log('1. Testing GET /checklist-pdfs');
    const getResponse = await axios.get(`${BASE_URL}/checklist-pdfs`);
    console.log('✅ Success:', getResponse.data);
    console.log('');

    // Test 2: Upload a checklist PDF
    console.log('2. Testing POST /checklist-pdfs');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testPdfPath));
    formData.append('name', 'Test Checklist PDF');
    formData.append('description', 'This is a test PDF upload');

    const uploadResponse = await axios.post(`${BASE_URL}/checklist-pdfs`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    console.log('✅ Upload Success:', uploadResponse.data);
    console.log('');

    console.log('🎉 All tests passed!');
    console.log('📝 The checklist PDF upload should now work in the frontend.');

  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.error('🔍 500 Error Details:', error.response.data);
    }
  }
}

testChecklistUpload(); 