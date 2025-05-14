/**
 * API Connection Test Script for FinPath Insight
 * Tests Node.js backend, FastAPI, and Supabase connections with fallback options
 * Enhanced for production deployment
 */

import axios from 'axios';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Get the current file path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Get API URLs from environment or use defaults
const NODE_API_URL = process.env.VITE_API_BASE_URL || 'https://fininsight.onrender.com';
const FASTAPI_URL = process.env.VITE_FASTAPI_URL || 'https://fin-path-insight-fastapi.onrender.com';
const LOCAL_API_URL = 'http://localhost:8080';
const NETLIFY_URL = process.env.NETLIFY_URL || 'https://fin-path-insight.netlify.app';

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ydakwyplcqoshxcdllah.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYWt3eXBsY3Fvc2h4Y2RsbGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTAwNTMsImV4cCI6MjA2Mjc4NjA1M30.J0c0YqSsR9XbtbYLVOq6oqQwYQ3G7j65Q0stEtS4W2s';

console.log(`Using Node.js API URL: ${NODE_API_URL}`);
console.log(`Using FastAPI URL: ${FASTAPI_URL}`);
console.log(`Using Local API URL: ${LOCAL_API_URL}`);
console.log(`Using Netlify URL: ${NETLIFY_URL}`);
console.log(`Using Supabase URL: ${SUPABASE_URL}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// API endpoints to test
const endpoints = [
  // Supabase direct connection is tested separately
  
  // FastAPI endpoints
  {
    name: 'FastAPI Root',
    url: `${FASTAPI_URL}/`,
    method: 'GET',
    category: 'health',
    critical: false,
    fallback: null
  },
  {
    name: 'FastAPI Docs',
    url: `${FASTAPI_URL}/docs`,
    method: 'GET',
    category: 'health',
    critical: false,
    fallback: null
  },
  
  // News API endpoints
  {
    name: 'Global News API',
    url: `${NETLIFY_URL}/fastapi/news/market/global`,
    method: 'GET',
    category: 'news',
    critical: false,
    fallback: `${FASTAPI_URL}/api/v1/news/latest?market=global`
  },
  {
    name: 'India News API',
    url: `${NETLIFY_URL}/fastapi/news/market/india`,
    method: 'GET',
    category: 'news',
    critical: false,
    fallback: `${FASTAPI_URL}/api/v1/news/latest?market=india`
  },
  {
    name: 'Latest News API',
    url: `${NETLIFY_URL}/api/news/latest`,
    method: 'GET',
    category: 'news',
    critical: false,
    fallback: `${FASTAPI_URL}/api/v1/news/latest`
  },
  
  // Market Data endpoints
  {
    name: 'Stock Peers API',
    url: `${NETLIFY_URL}/api/stocks/peers`,
    method: 'GET',
    category: 'stocks',
    critical: false,
    fallback: `${FASTAPI_URL}/api/v1/market-data/peers`
  },
  {
    name: 'Indian Market Overview',
    url: `${NETLIFY_URL}/api/market-data/indian-market/overview`,
    method: 'GET',
    category: 'market',
    critical: false,
    fallback: `${FASTAPI_URL}/api/v1/market-data/indian-market/overview`
  },
  
  // AI Analysis endpoint
  {
    name: 'AI Analysis API',
    url: `${NETLIFY_URL}/api/ai-analysis/company`,
    method: 'GET',
    category: 'ai',
    critical: false,
    fallback: `${FASTAPI_URL}/api/v1/ai-analysis/company`
  },
  
  // FinGenie chat endpoint
  {
    name: 'FinGenie Chat API',
    url: `${NETLIFY_URL}/fastapi/fingenie/chat`,
    method: 'GET',
    category: 'chat',
    critical: false,
    fallback: `${FASTAPI_URL}/api/v1/fingenie/chat`
  },
  
  // Try local server if running
  {
    name: 'Local Server Check',
    url: `${LOCAL_API_URL}/health`,
    method: 'GET',
    category: 'local',
    critical: false,
    optional: true,
    fallback: null
  }
];

// Create axios instance with timeout and retry config
const api = axios.create({
  timeout: 30000, // 30 seconds timeout for production
  headers: {
    'Content-Type': 'application/json',
    'X-Test-Client': 'API-Test-Script',
    'X-Environment': process.env.NODE_ENV || 'development'
  }
});

// Function to test Supabase connection directly
async function testSupabaseConnection() {
  console.log('Testing direct Supabase connection...');
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test a simple query to the health_check table
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('health_check')
      .select('*')
      .limit(1);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (error) {
      console.log(`  ❌ Supabase connection failed: ${error.message}`);
      return {
        name: 'Direct Supabase Connection',
        success: false,
        status: 500,
        responseTime,
        error: error.message,
        critical: true,
        category: 'supabase'
      };
    }
    
    console.log(`  ✅ Supabase connection successful (${responseTime}ms)`);
    return {
      name: 'Direct Supabase Connection',
      success: true,
      status: 200,
      responseTime,
      data: data ? 'Data retrieved successfully' : 'No data found',
      critical: true,
      category: 'supabase'
    };
  } catch (error) {
    console.log(`  ❌ Supabase connection failed: ${error.message}`);
    return {
      name: 'Direct Supabase Connection',
      success: false,
      status: 500,
      responseTime: 0,
      error: error.message,
      critical: true,
      category: 'supabase'
    };
  }
}

// Function to test an API endpoint with retry and fallback logic
async function testEndpoint(endpoint, retries = 2) {
  console.log(`Testing ${endpoint.name}...`);
  
  // Try primary endpoint
  let primaryResult = await tryEndpoint(endpoint, retries);
  
  // If primary failed and fallback exists, try fallback
  if (!primaryResult.success && endpoint.fallback) {
    console.log(`  Primary endpoint failed. Trying fallback URL: ${endpoint.fallback}`);
    
    const fallbackEndpoint = {
      ...endpoint,
      url: endpoint.fallback,
      isFallback: true
    };
    
    const fallbackResult = await tryEndpoint(fallbackEndpoint, 1);
    
    if (fallbackResult.success) {
      console.log('  Fallback successful!');
      return {
        ...fallbackResult,
        primaryFailed: true,
        fallbackUsed: true
      };
    } else {
      console.log('  Fallback also failed.');
      return {
        ...primaryResult,
        fallbackTried: true,
        fallbackFailed: true
      };
    }
  }
  
  return primaryResult;
}

// Helper function to try a single endpoint with retries
async function tryEndpoint(endpoint, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`  Attempt ${attempt + 1}/${retries + 1} for ${endpoint.isFallback ? 'fallback' : 'primary'} endpoint...`);
      
      const startTime = Date.now();
      const response = await api({
        method: endpoint.method,
        url: endpoint.url,
        validateStatus: () => true // Don't throw on any status code
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const status = response.status;
      const success = status >= 200 && status < 300;
      
      // Get response data (truncated for large responses)
      let responseData = null;
      if (response.data) {
        if (typeof response.data === 'object') {
          responseData = JSON.stringify(response.data).substring(0, 100);
          if (JSON.stringify(response.data).length > 100) responseData += '...';
        } else if (typeof response.data === 'string') {
          responseData = response.data.substring(0, 100);
          if (response.data.length > 100) responseData += '...';
        }
      }
      
      console.log(`  Status: ${status} (${success ? 'Success ' : 'Failed '})`);
      console.log(`  Response Time: ${responseTime}ms`);
      
      if (success) {
        return {
          name: endpoint.name,
          url: endpoint.url,
          status,
          success: true,
          responseTime,
          responseData,
          category: endpoint.category,
          critical: endpoint.critical,
          isFallback: endpoint.isFallback || false,
          timestamp: new Date().toISOString(),
        };
      } else if (attempt < retries) {
        console.log(`  Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    } catch (error) {
      const errorMessage = error.code || error.message || 'Unknown error';
      console.error(`  Error: ${errorMessage}`);
      
      if (error.code === 'ECONNABORTED') {
        console.log('  Request timed out after 15 seconds');
      }
      
      if (attempt < retries) {
        console.log(`  Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      } else if (endpoint.optional) {
        console.log('  This endpoint is optional, continuing...');
        return {
          name: endpoint.name,
          url: endpoint.url,
          status: 'Skipped',
          success: null,
          error: errorMessage,
          category: endpoint.category,
          critical: endpoint.critical,
          optional: true,
          isFallback: endpoint.isFallback || false,
          timestamp: new Date().toISOString(),
        };
      }
    }
  }
  
  // All retries failed
  return {
    name: endpoint.name,
    url: endpoint.url,
    status: 'Failed',
    success: false,
    error: 'All retry attempts failed',
    category: endpoint.category,
    critical: endpoint.critical,
    isFallback: endpoint.isFallback || false,
    timestamp: new Date().toISOString(),
  };
}

// Main function to test all endpoints
async function testAllEndpoints() {
  console.log('\n=== Starting API Connection Tests ===\n');
  
  const results = {
    total: endpoints.length + 1, // +1 for direct Supabase test
    successful: 0,
    failed: 0,
    fallbacksUsed: 0,
    details: [],
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };
  
  // First test Supabase connection directly
  try {
    const supabaseResult = await testSupabaseConnection();
    results.details.push(supabaseResult);
    
    if (supabaseResult.success) {
      results.successful++;
    } else {
      results.failed++;
    }
  } catch (error) {
    console.error('Unexpected error testing Supabase connection:', error);
    results.details.push({
      name: 'Direct Supabase Connection',
      success: false,
      error: error.message,
      critical: true,
      category: 'supabase'
    });
    results.failed++;
  }
  
  for (const endpoint of endpoints) {
    // Skip optional endpoints in production if they're marked as optional
    if (endpoint.optional && process.env.NODE_ENV === 'production') {
      console.log(`Skipping optional endpoint ${endpoint.name} in production mode`);
      continue;
    }
    
    try {
      const result = await testEndpoint(endpoint);
      results.details.push(result);
      
      if (result.success) {
        results.successful++;
        if (result.fallbackUsed) {
          results.fallbacksUsed++;
        }
      } else {
        results.failed++;
      }
    } catch (error) {
      console.error(`Unexpected error testing ${endpoint.name}:`, error);
      results.details.push({
        name: endpoint.name,
        url: endpoint.url,
        success: false,
        error: error.message,
        critical: endpoint.critical,
        category: endpoint.category
      });
      results.failed++;
    }
  }
  
  // Calculate statistics
  const totalTested = results.successful + results.failed;
  const successRate = totalTested > 0 ? Math.round((results.successful / totalTested) * 100) : 0;
  const criticalEndpoints = endpoints.filter(e => e.critical).length;
  const criticalFailed = results.details.filter(r => r.critical && !r.success).length;
  
  // Save results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = `api-test-results-${timestamp}.json`;
  
  await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
  
  // Print summary
  console.log('\n==============================');
  console.log('API CONNECTION TEST SUMMARY');
  console.log('==============================');
  console.log(`Total Endpoints: ${endpoints.length}`);
  console.log(`Successful: ${results.success}/${totalTested} (${successRate}%)`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Fallbacks Used: ${results.fallbackUsed}`);
  console.log(`Critical Endpoints: ${criticalEndpoints} (${criticalFailed} failed)`);
  console.log(`Results saved to: ${resultsFile}`);
  
  // Critical failures
  const criticalFailures = results.details.filter(r => r.critical && !r.success);
  if (criticalFailures.length > 0) {
    console.log('\n⚠️ CRITICAL FAILURES DETECTED ⚠️');
    criticalFailures.forEach(r => {
      console.log(`  - ${r.name} (${r.url})`);
    });
    console.log('\nThese failures may impact core application functionality!');
  }
  
  // Provide recommendations based on results
  console.log('\n==============================');
  console.log('RECOMMENDATIONS');
  console.log('==============================');
  
  if (criticalFailures.length > 0) {
    console.log('1. Check if the Render.com and FastAPI services are running');
    console.log('2. Verify your network connection');
    console.log('3. Check if your Supabase connection is working');
    console.log('4. Ensure VITE_ENABLE_FALLBACK_APIS=true is set in your environment');
    console.log('5. Verify the Netlify redirects in netlify.toml are correctly configured');
  } else if (results.fallbackUsed > 0) {
    console.log('Some primary endpoints failed but fallbacks worked:');
    results.details.filter(r => r.fallbackUsed).forEach(r => {
      console.log(`  - ${r.name}: Using fallback at ${r.url}`);
    });
    console.log('\nYour application should work with fallbacks enabled.');
  } else if (results.failed > 0) {
    console.log('Some non-critical endpoints failed, but the application should still function.');
    console.log('Consider enabling fallback APIs if specific features are not working.');
  } else {
    console.log('All API connections are working perfectly! Your application should function optimally.');
  }
  
  return results;
}

// Run tests
testAllEndpoints()
  .then(results => {
    if (results.failed > 0 && results.details.some(r => r.critical && !r.success)) {
      console.log('\n⚠️ Some critical API connections failed. Check the detailed results file for more information.');
      process.exit(1);
    } else if (results.failed > 0) {
      console.log('\n⚠️ Some non-critical API connections failed, but the application should still function.');
      process.exit(0);
    } else {
      console.log('\n🎉 All API connections are working properly!');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('\n❌ Error running tests:', error);
    process.exit(1);
  });
