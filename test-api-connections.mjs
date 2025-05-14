/**
 * API Connection Test Script
 * 
 * This script tests connections to all API endpoints used by the FinPath Insight application.
 * Run this before deploying to ensure all connections are working properly.
 */

import axios from 'axios';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get the current file path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get environment variables
const FASTAPI_URL = process.env.VITE_FASTAPI_URL || 'https://fininsight.onrender.com';
const NETLIFY_URL = process.env.NETLIFY_URL || 'https://fin-insight.netlify.app';

console.log(`Using FastAPI URL: ${FASTAPI_URL}`);
console.log(`Using Netlify URL: ${NETLIFY_URL}`);

// API endpoints to test
const endpoints = [
  // Basic connectivity tests
  {
    name: 'FastAPI Root',
    url: `${FASTAPI_URL}/`,
    method: 'GET',
    category: 'health'
  },
  {
    name: 'FastAPI Docs',
    url: `${FASTAPI_URL}/docs`,
    method: 'GET',
    category: 'health'
  },
  
  // API endpoints through Netlify redirects
  {
    name: 'Global News API',
    url: `${NETLIFY_URL}/fastapi/news/market/global`,
    method: 'GET',
    category: 'news',
    fallback: `${FASTAPI_URL}/api/v1/news/latest?market=global`
  },
  {
    name: 'India News API',
    url: `${NETLIFY_URL}/fastapi/news/market/india`,
    method: 'GET',
    category: 'news',
    fallback: `${FASTAPI_URL}/api/v1/news/latest?market=india`
  },
  {
    name: 'Latest News API',
    url: `${NETLIFY_URL}/api/news/latest`,
    method: 'GET',
    category: 'news',
    fallback: `${FASTAPI_URL}/api/v1/news/latest`
  },
  {
    name: 'Indian Market Overview',
    url: `${NETLIFY_URL}/api/market-data/indian-market/overview`,
    method: 'GET',
    category: 'market',
    fallback: `${FASTAPI_URL}/api/v1/market-data/indian-market/overview`
  },
  {
    name: 'External API (Alpha Vantage)',
    url: 'https://www.alphavantage.co/',
    method: 'GET',
    category: 'external'
  }
];

// Create axios instance with timeout
const api = axios.create({
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Test all endpoints
async function testEndpoints() {
  console.log('🔍 Testing API connections...\n');
  
  const results = {
    success: 0,
    failed: 0,
    details: []
  };
  
  for (const endpoint of endpoints) {
    process.stdout.write(`Testing ${endpoint.name}... `);
    
    let success = false;
    let responseData = null;
    let statusCode = null;
    let duration = null;
    let errorMessage = null;
    
    // Try primary URL
    try {
      const startTime = Date.now();
      const response = await api({
        method: endpoint.method,
        url: endpoint.url,
        timeout: 15000, // 15 seconds timeout (shorter for faster testing)
        validateStatus: () => true // Don't throw on any status code
      });
      duration = Date.now() - startTime;
      statusCode = response.status;
      
      if (response.status >= 200 && response.status < 300) {
        success = true;
        responseData = response.data;
        results.success++;
        console.log(`✅ (${statusCode}, ${duration}ms)`);
      } else if (endpoint.fallback) {
        // Try fallback URL if primary failed
        process.stdout.write(`Failed, trying fallback... `);
        
        try {
          const fallbackStartTime = Date.now();
          const fallbackResponse = await api({
            method: endpoint.method,
            url: endpoint.fallback,
            timeout: 15000,
            validateStatus: () => true
          });
          
          duration = Date.now() - fallbackStartTime;
          statusCode = fallbackResponse.status;
          
          if (fallbackResponse.status >= 200 && fallbackResponse.status < 300) {
            success = true;
            responseData = fallbackResponse.data;
            results.success++;
            console.log(`✅ (${statusCode}, ${duration}ms) [Fallback]`);
          } else {
            results.failed++;
            console.log(`❌ (${statusCode}, ${duration}ms) [Fallback]`);
          }
        } catch (fallbackError) {
          results.failed++;
          errorMessage = fallbackError.message;
          console.log(`❌ (${fallbackError.code || 'ERROR'}) [Fallback]`);
        }
      } else {
        results.failed++;
        console.log(`❌ (${statusCode}, ${duration}ms)`);
      }
    } catch (error) {
      errorMessage = error.message;
      
      // Try fallback if available
      if (endpoint.fallback) {
        process.stdout.write(`Failed (${error.code || 'ERROR'}), trying fallback... `);
        
        try {
          const fallbackStartTime = Date.now();
          const fallbackResponse = await api({
            method: endpoint.method,
            url: endpoint.fallback,
            timeout: 15000,
            validateStatus: () => true
          });
          
          duration = Date.now() - fallbackStartTime;
          statusCode = fallbackResponse.status;
          
          if (fallbackResponse.status >= 200 && fallbackResponse.status < 300) {
            success = true;
            responseData = fallbackResponse.data;
            results.success++;
            console.log(`✅ (${statusCode}, ${duration}ms) [Fallback]`);
          } else {
            results.failed++;
            console.log(`❌ (${statusCode}, ${duration}ms) [Fallback]`);
          }
        } catch (fallbackError) {
          results.failed++;
          errorMessage = `Primary: ${error.message}, Fallback: ${fallbackError.message}`;
          console.log(`❌ (${fallbackError.code || 'ERROR'}) [Fallback]`);
        }
      } else {
        results.failed++;
        console.log(`❌ (${error.code || 'ERROR'})`);
      }
    }
    
    // Record results
    results.details.push({
      name: endpoint.name,
      url: endpoint.url,
      fallbackUrl: endpoint.fallback,
      status: success ? 'SUCCESS' : 'FAILED',
      statusCode,
      duration,
      data: responseData ? JSON.stringify(responseData).substring(0, 100) + '...' : null,
      error: errorMessage
    });
  }
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`Total: ${endpoints.length}`);
  console.log(`Success: ${results.success}`);
  console.log(`Failed: ${results.failed}`);
  
  // Save results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = path.join(__dirname, `api-test-results-${timestamp}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  
  console.log(`\n📝 Detailed results saved to: ${resultsFile}`);
  
  return results;
}

// Run tests
testEndpoints()
  .then(results => {
    if (results.failed > 0) {
      console.log('\n⚠️ Some API connections failed. Check the detailed results file for more information.');
      process.exit(1);
    } else {
      console.log('\n🎉 All API connections are working properly!');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('\n❌ Error running tests:', error);
    process.exit(1);
  });
