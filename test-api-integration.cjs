/**
 * API Integration Test Script for FinPath Insight
 * 
 * This script tests the integration between the frontend and FastAPI backend
 * by making requests to key API endpoints and verifying the responses.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:8000'; // FastAPI backend URL
const PROXY_BASE_URL = 'http://localhost:8080/api'; // Frontend proxy URL
const TEST_STOCK_SYMBOL = 'RELIANCE'; // Test stock symbol
const TEST_MARKET = 'india'; // Test market

// Test results
const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

// Helper function to run a test
async function runTest(name, endpoint, testFn) {
  console.log(`Testing ${name}...`);
  results.summary.total++;
  
  try {
    const response = await axios.get(endpoint);
    const success = testFn(response);
    
    if (success) {
      console.log(`✅ ${name}: PASSED`);
      results.summary.passed++;
      results.tests.push({
        name,
        endpoint,
        status: 'PASSED',
        statusCode: response.status
      });
    } else {
      console.log(`❌ ${name}: FAILED - Response validation failed`);
      results.summary.failed++;
      results.tests.push({
        name,
        endpoint,
        status: 'FAILED',
        statusCode: response.status,
        error: 'Response validation failed'
      });
    }
  } catch (error) {
    console.log(`❌ ${name}: FAILED - ${error.message}`);
    results.summary.failed++;
    results.tests.push({
      name,
      endpoint,
      status: 'FAILED',
      error: error.message
    });
  }
}

// Main test function
async function runTests() {
  console.log('=== FinPath Insight API Integration Tests ===\n');
  
  // Test FastAPI backend health
  await runTest(
    'FastAPI Backend Health',
    `${API_BASE_URL}/`,
    (response) => response.status === 200 && response.data.message
  );
  
  // Test Supabase health check
  await runTest(
    'Supabase Connection',
    `${API_BASE_URL}/api/supabase/health`,
    (response) => response.status === 200 && response.data.status
  );
  
  // Test stock data API
  await runTest(
    'Stock Data API',
    `${API_BASE_URL}/api/supabase/stocks/${TEST_STOCK_SYMBOL}`,
    (response) => response.status === 200 && response.data
  );
  
  // Test market overview API
  await runTest(
    'Market Overview API',
    `${API_BASE_URL}/api/supabase/market-overview/${TEST_MARKET}`,
    (response) => response.status === 200 && response.data
  );
  
  // Test news API
  await runTest(
    'News API',
    `${API_BASE_URL}/api/supabase/news?market=${TEST_MARKET}`,
    (response) => response.status === 200 && Array.isArray(response.data)
  );
  
  // Test company news API
  await runTest(
    'Company News API',
    `${API_BASE_URL}/api/supabase/company-news/${TEST_STOCK_SYMBOL}`,
    (response) => response.status === 200 && Array.isArray(response.data)
  );
  
  // Test frontend proxy to backend
  await runTest(
    'Frontend Proxy to Backend',
    `${PROXY_BASE_URL}/supabase/health`,
    (response) => response.status === 200 && response.data.status
  );
  
  // Print summary
  console.log('\n=== Test Summary ===');
  console.log(`Total tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  
  // Save results to file
  const resultsFilename = `api-test-results-${new Date().toISOString().replace(/:/g, '-')}.json`;
  fs.writeFileSync(
    path.join(__dirname, resultsFilename),
    JSON.stringify(results, null, 2)
  );
  console.log(`\nResults saved to ${resultsFilename}`);
}

// Run tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
