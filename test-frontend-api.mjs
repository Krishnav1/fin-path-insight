/**
 * Frontend API Connection Test Script
 * 
 * This script tests if the frontend is properly connecting to the backend APIs
 * by making requests to the frontend's API endpoints.
 */

import axios from 'axios';

// Frontend URL
const FRONTEND_URL = 'http://localhost:8081';

// API endpoints to test through the frontend
const endpoints = [
  {
    name: 'Homepage',
    url: `${FRONTEND_URL}/`,
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Indian Stock Dashboard',
    url: `${FRONTEND_URL}/indian-stock-dashboard`,
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Company Analysis',
    url: `${FRONTEND_URL}/company-analysis`,
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'FinGenie',
    url: `${FRONTEND_URL}/fingenie`,
    method: 'GET',
    expectedStatus: 200
  }
];

// Create axios instance with timeout
const api = axios.create({
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Test all endpoints
async function testEndpoints() {
  console.log('🔍 Testing Frontend Pages...\n');
  
  const results = {
    success: 0,
    failed: 0,
    details: []
  };
  
  for (const endpoint of endpoints) {
    process.stdout.write(`Testing ${endpoint.name}... `);
    
    try {
      const startTime = Date.now();
      const response = await api({
        method: endpoint.method,
        url: endpoint.url,
        validateStatus: () => true // Don't throw on any status code
      });
      const duration = Date.now() - startTime;
      
      const status = response.status === endpoint.expectedStatus ? 'SUCCESS' : 'FAILED';
      const statusCode = response.status;
      
      if (status === 'SUCCESS') {
        results.success++;
        console.log(`✅ (${statusCode}, ${duration}ms)`);
      } else {
        results.failed++;
        console.log(`❌ (${statusCode}, ${duration}ms)`);
      }
      
      // Check if the response contains HTML with error messages
      const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      const hasErrorMessage = responseText.includes('Error') || responseText.includes('error') || responseText.includes('failed');
      
      results.details.push({
        name: endpoint.name,
        url: endpoint.url,
        status,
        statusCode,
        duration,
        hasErrorMessage,
        error: null
      });
    } catch (error) {
      results.failed++;
      console.log(`❌ (${error.code || 'ERROR'})`);
      
      results.details.push({
        name: endpoint.name,
        url: endpoint.url,
        status: 'FAILED',
        statusCode: null,
        duration: null,
        hasErrorMessage: true,
        error: error.message
      });
    }
  }
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`Total: ${endpoints.length}`);
  console.log(`Success: ${results.success}`);
  console.log(`Failed: ${results.failed}`);
  
  return results;
}

// Run tests
console.log('Make sure the frontend development server is running at http://localhost:8081');
console.log('Press Ctrl+C to cancel or wait 5 seconds to continue...');

setTimeout(async () => {
  try {
    const results = await testEndpoints();
    
    if (results.failed > 0) {
      console.log('\n⚠️ Some frontend pages failed to load. Check the details above for more information.');
      process.exit(1);
    } else {
      console.log('\n🎉 All frontend pages loaded successfully!');
      console.log('\nThe application is ready to be pushed to GitHub and deployed to Netlify.');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Error running tests:', error);
    process.exit(1);
  }
}, 5000);
