/**
 * Script to fetch stock data from Yahoo Finance and save it to static files
 * This script is run by GitHub Actions periodically or can be run manually
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import stockService from '../services/stockService.js';

// Load environment variables
dotenv.config();

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../public/data');

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fin-path-insight';

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
  
  // Update individual stock data
  const stocks = TOP_STOCKS[market] || [];
  for (const symbol of stocks) {
    try {
      console.log(`Fetching data for ${symbol}...`);
      const stockData = await stockService.getStockData(symbol);
      
      if (stockData) {
        // Save stock data to file
        const stockFile = path.join(dataDir, `stock_${symbol.replace(/\./g, '_')}.json`);
        await fs.writeFile(stockFile, JSON.stringify(stockData, null, 2));
        console.log(`Saved stock data for ${symbol} to ${stockFile}`);
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

// Main function
async function main() {
  try {
    console.log('Starting stock data update script...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
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
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
main(); 