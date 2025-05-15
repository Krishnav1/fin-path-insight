/**
 * API Integration Test Script for FinPath Insight
 * 
 * This script tests the integration between the frontend and FastAPI backend
 * by making requests to key API endpoints and verifying the responses.
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE_URL = 'https://fininsight.onrender.com'; // Production FastAPI backend URL
const PROXY_BASE_URL = 'https://fin-insight.netlify.app/api'; // Production frontend proxy URL
// For local testing, uncomment these lines:
// const API_BASE_URL = 'http://localhost:8000'; // FastAPI backend URL
// const PROXY_BASE_URL = 'http://localhost:8080/api'; // Frontend proxy URL
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
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   URL: ${endpoint}`);
      console.log(`   Response data: ${JSON.stringify(error.response.data).substring(0, 150)}...`);
    }
    results.summary.failed++;
    results.tests.push({
      name,
      endpoint,
      status: 'FAILED',
      statusCode: error.response ? error.response.status : 'Unknown',
      error: error.message,
      responseData: error.response ? error.response.data : null
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
  
  // Test stock data API
  await runTest(
    'Stock Data API',
    `${API_BASE_URL}/api/market-data/stock/${TEST_STOCK_SYMBOL}`,
    (response) => response.status === 200 && response.data
  );
  
  // Test stock daily data API
  await runTest(
    'Stock Daily Data API',
    `${API_BASE_URL}/api/market-data/stock/${TEST_STOCK_SYMBOL}/daily`,
    (response) => response.status === 200 && response.data
  );
  
  // Test company overview API
  await runTest(
    'Company Overview API',
    `${API_BASE_URL}/api/market-data/stock/${TEST_STOCK_SYMBOL}/overview`,
    (response) => response.status === 200 && response.data
  );
  
  // Test Indian market overview API
  await runTest(
    'Indian Market Overview API',
    `${API_BASE_URL}/api/market-data/indian-market/overview`,
    (response) => response.status === 200 && response.data
  );
  
  // Test latest news API
  await runTest(
    'Latest News API',
    `${API_BASE_URL}/api/news/latest?market=${TEST_MARKET}`,
    (response) => response.status === 200 && response.data
  );
  
  // Test company news API
  await runTest(
    'Company News API',
    `${API_BASE_URL}/api/news/company/${TEST_STOCK_SYMBOL}`,
    (response) => response.status === 200 && response.data
  );
  
  // Test frontend proxy to backend
  await runTest(
    'Frontend Proxy to Backend',
    `${PROXY_BASE_URL}/market-data/stock/${TEST_STOCK_SYMBOL}`,
    (response) => response.status === 200 && response.data
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
