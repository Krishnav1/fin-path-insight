/**
 * Script to fetch stock data from Yahoo Finance and save it to Supabase and static files
 * This script is run by GitHub Actions periodically or can be run manually
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import stockService from '../services/stockService.js';

// Load environment variables
dotenv.config();

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../public/data');

// Supabase connection
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ydakwyplcqoshxcdllah.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYWt3eXBsY3Fvc2h4Y2RsbGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTAwNTMsImV4cCI6MjA2Mjc4NjA1M30.J0c0YqSsR9XbtbYLVOq6oqQwYQ3G7j65Q0stEtS4W2s';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// List of top stocks by market to update
const TOP_STOCKS = {
  'india': [
    'RELIANCE.NS',
    'TCS.NS',
    'HDFCBANK.NS',
    'INFY.NS',
    'ICICIBANK.NS',
    'HINDUNILVR.NS',
    'SBIN.NS',
    'BHARTIARTL.NS',
    'KOTAKBANK.NS',
    'ITC.NS'
  ],
  'us': [
    'AAPL',
    'MSFT',
    'GOOGL',
    'AMZN',
    'NVDA',
    'META',
    'TSLA',
    'BRK-B',
    'JPM',
    'V'
  ],
  'uk': [
    'SHELL.L',
    'AZN.L',
    'HSBA.L',
    'ULVR.L',
    'RIO.L',
    'BP.L',
    'GSK.L',
    'DGE.L',
    'LGEN.L',
    'VOD.L'
  ]
};

// Function to ensure data directory exists
async function ensureDataDirExists() {
  try {
    await fs.access(dataDir);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(dataDir, { recursive: true });
    console.log(`Created data directory: ${dataDir}`);
  }
}

// Function to update stock data for a single market
async function updateMarketData(market) {
  console.log(`Updating stock data for ${market} market...`);
  
  // Get market overview data
  const marketOverview = await stockService.getMarketOverview(market, 20);
  
  // Save market overview to file
  const marketFile = path.join(dataDir, `market_${market}.json`);
  await fs.writeFile(marketFile, JSON.stringify(marketOverview, null, 2));
  console.log(`Saved market overview to ${marketFile}`);
  
  // Save market overview to Supabase
  if (marketOverview && marketOverview.indices) {
    // Save indices to Supabase
    for (const index of marketOverview.indices) {
      const indexData = {
        symbol: index.symbol,
        name: index.name,
        price: index.price,
        change: index.change,
        changePercent: index.changePercent,
        market: market,
        timestamp: new Date().toISOString()
      };
      
      await saveToSupabase(indexData, 'market_indices');
    }
    
    // Save market status to Supabase
    if (marketOverview.marketStatus) {
      const { data, error } = await supabase
        .from('market_status')
        .upsert({
          market: market,
          status: marketOverview.marketStatus.status || 'unknown',
          next_open: marketOverview.marketStatus.nextOpen,
          next_close: marketOverview.marketStatus.nextClose,
          timestamp: new Date().toISOString()
        }, { onConflict: 'market' })
        .select();
      
      if (error) {
        console.error(`Error saving market status to Supabase:`, error.message);
      } else {
        console.log(`Saved market status for ${market} to Supabase`);
      }
    }
  }
  
  // Update individual stock data
  const stocks = TOP_STOCKS[market] || [];
  for (const symbol of stocks) {
    try {
      console.log(`Fetching data for ${symbol}...`);
      const stockData = await stockService.getStockData(symbol);
      
      if (stockData) {
        // Add market information
        stockData.market = market;
        
        // Save stock data to file
        const stockFile = path.join(dataDir, `stock_${symbol.replace(/\./g, '_')}.json`);
        await fs.writeFile(stockFile, JSON.stringify(stockData, null, 2));
        console.log(`Saved stock data for ${symbol} to ${stockFile}`);
        
        // Save to Supabase
        await saveToSupabase(stockData);
      } else {
        console.error(`Failed to fetch data for ${symbol}`);
      }
    } catch (error) {
      console.error(`Error processing stock ${symbol}:`, error);
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Function to check Supabase connection
async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('health_check').select('*').limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error.message);
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Error checking Supabase connection:', error.message);
    return false;
  }
}

// Save stock data to Supabase
async function saveToSupabase(stockData, table = 'stocks') {
  try {
    // Format data for Supabase - convert camelCase to snake_case
    const formattedData = {
      symbol: stockData.symbol,
      name: stockData.name,
      price: stockData.price,
      change: stockData.change,
      change_percent: stockData.changePercent,
      volume: stockData.volume,
      previous_close: stockData.previousClose,
      open: stockData.open,
      high: stockData.high,
      low: stockData.low,
      market_cap: stockData.marketCap,
      timestamp: stockData.timestamp || new Date().toISOString(),
      market: stockData.market || getMarketFromSymbol(stockData.symbol)
    };
    
    // Insert or update data in Supabase
    const { data, error } = await supabase
      .from(table)
      .upsert(formattedData, { onConflict: 'symbol' })
      .select();
    
    if (error) {
      console.error(`Error saving to Supabase (${table}):`, error.message);
      return false;
    }
    
    console.log(`Saved ${stockData.symbol} to Supabase (${table})`);
    return true;
  } catch (error) {
    console.error(`Error in saveToSupabase (${table}):`, error.message);
    return false;
  }
}

// Helper function to determine market from symbol
function getMarketFromSymbol(symbol) {
  if (symbol.endsWith('.NS') || symbol.endsWith('.BO')) {
    return 'india';
  } else if (symbol.endsWith('.L')) {
    return 'uk';
  } else {
    return 'us';
  }
}

// Main function
async function main() {
  let connected = false;
  
  try {
    console.log('Starting stock data update script...');
    
    // Check Supabase connection
    connected = await checkSupabaseConnection();
    if (!connected) {
      console.log('Warning: Proceeding without Supabase connection. Will save data to files only.');
    }
    
    // Ensure data directory exists
    await ensureDataDirExists();
    
    // Process each market
    const markets = Object.keys(TOP_STOCKS);
    for (const market of markets) {
      await updateMarketData(market);
    }
    
    console.log('Stock data update completed successfully');
  } catch (error) {
    console.error('Error in stock data update script:', error);
    process.exit(1);
  }
}

// Run the script
main(); 