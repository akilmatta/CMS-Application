const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testSiteAPI() {
  console.log('🧪 Testing Site Management API...\n');

  try {
    // Test 1: Create a site
    console.log('1. Creating a new site...');
    const createSiteResponse = await axios.post(`${BASE_URL}/sites`, {
      name: 'Test Construction Site',
      location: '123 Main Street, Downtown'
    });
    console.log('✅ Site created:', createSiteResponse.data.name);
    const siteId = createSiteResponse.data.id;

    // Test 2: Get all sites
    console.log('\n2. Fetching all sites...');
    const getAllSitesResponse = await axios.get(`${BASE_URL}/sites`);
    console.log('✅ Found', getAllSitesResponse.data.length, 'sites');

    // Test 3: Get specific site
    console.log('\n3. Fetching specific site...');
    const getSiteResponse = await axios.get(`${BASE_URL}/sites/${siteId}`);
    console.log('✅ Site details:', getSiteResponse.data.name, 'at', getSiteResponse.data.location);

    // Test 4: Get site checklists (should be empty initially)
    console.log('\n4. Fetching site checklists...');
    const getChecklistsResponse = await axios.get(`${BASE_URL}/sites/${siteId}/checklists`);
    console.log('✅ Found', getChecklistsResponse.data.length, 'checklists');

    console.log('\n🎉 All basic site API tests passed!');
    console.log('\nNote: Employee assignment and checklist creation tests require existing employees in the database.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testSiteAPI(); 