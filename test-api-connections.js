/**
 * API Connection Test Script
 * 
 * This script tests connections to all API endpoints used by the FinPath Insight application.
 * Run this before deploying to ensure all connections are working properly.
 */

import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// API endpoints to test
const endpoints = [
  {
    name: 'FastAPI Root',
    url: 'https://fin-path-insight-fastapi.onrender.com/api',
    method: 'GET'
  },
  {
    name: 'Indian Market Overview',
    url: 'https://fin-path-insight-fastapi.onrender.com/api/market-data/indian-market/overview',
    method: 'GET'
  },
  {
    name: 'Stock Data (RELIANCE.NS)',
    url: 'https://fin-path-insight-fastapi.onrender.com/api/market-data/stock/RELIANCE.NS',
    method: 'GET'
  },
  {
    name: 'Node.js Backend Health',
    url: 'https://fininsight.onrender.com/health',
    method: 'GET'
  },
  {
    name: 'MongoDB Connection (via Node.js)',
    url: 'https://fininsight.onrender.com/api/admin/db-status',
    method: 'GET'
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
    
    try {
      const startTime = Date.now();
      const response = await api({
        method: endpoint.method,
        url: endpoint.url,
        validateStatus: () => true // Don't throw on any status code
      });
      const duration = Date.now() - startTime;
      
      const status = response.status >= 200 && response.status < 300 ? 'SUCCESS' : 'FAILED';
      const statusCode = response.status;
      
      if (status === 'SUCCESS') {
        results.success++;
        console.log(`✅ (${statusCode}, ${duration}ms)`);
      } else {
        results.failed++;
        console.log(`❌ (${statusCode}, ${duration}ms)`);
      }
      
      results.details.push({
        name: endpoint.name,
        url: endpoint.url,
        status,
        statusCode,
        duration,
        data: response.data ? JSON.stringify(response.data).substring(0, 100) + '...' : null,
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
        data: null,
        error: error.message
      });
    }
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
