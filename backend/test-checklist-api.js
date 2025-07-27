const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testChecklistAPI() {
  try {
    console.log('🧪 Testing Checklist PDF API...\n');

    // Test 1: Get all checklist PDFs
    console.log('1. Testing GET /checklist-pdfs');
    const getResponse = await axios.get(`${BASE_URL}/checklist-pdfs`);
    console.log('✅ Success:', getResponse.data);
    console.log('');

    // Test 2: Test sites endpoint (should work)
    console.log('2. Testing GET /sites');
    const sitesResponse = await axios.get(`${BASE_URL}/sites`);
    console.log('✅ Success: Found', sitesResponse.data.length, 'sites');
    console.log('');

    console.log('🎉 All API tests passed!');
    console.log('📝 The SiteManagement page should now load correctly.');

  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
  }
}

testChecklistAPI(); 