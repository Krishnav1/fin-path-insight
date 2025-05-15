import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import stockService from '../services/stockService.js';
import cryptoService from '../services/cryptoService.js';

// Load environment variables
dotenv.config();

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../public/data');

// Popular Indian stocks to track
const INDIAN_STOCKS = [
  'TCS.NS',     // Tata Consultancy Services
  'RELIANCE.NS', // Reliance Industries
  'INFY.NS',    // Infosys
  'HDFCBANK.NS', // HDFC Bank
  'ICICIBANK.NS', // ICICI Bank
  'HINDUNILVR.NS', // Hindustan Unilever
  'SBIN.NS',    // State Bank of India
  'BAJFINANCE.NS', // Bajaj Finance
  'BHARTIARTL.NS', // Bharti Airtel
  'KOTAKBANK.NS' // Kotak Mahindra Bank
];

// Popular cryptocurrencies to track
const CRYPTOCURRENCIES = [
  'bitcoin',
  'ethereum',
  'binancecoin',
  'ripple',
  'solana'
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fin-path-insight')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`Created data directory: ${DATA_DIR}`);
}

/**
 * Update stock data files
 */
async function updateStockData() {
  try {
    console.log('Updating stock data...');
    
    // Create array to hold all stock data
    const allStocks = [];
    
    // Process each stock
    for (const symbol of INDIAN_STOCKS) {
      try {
        console.log(`Fetching data for ${symbol}...`);
        const stockData = await stockService.getStockData(symbol);
        
        // Add to all stocks array
        allStocks.push({
          symbol: stockData.symbol,
          displaySymbol: stockData.displaySymbol,
          name: stockData.name,
          price: stockData.price,
          change: stockData.change,
          changePercent: stockData.changePercent,
          lastUpdated: stockData.lastUpdated
        });
        
        // Save individual stock data to file
        fs.writeFileSync(
          path.join(DATA_DIR, `stock-${stockData.displaySymbol}.json`),
          JSON.stringify(stockData, null, 2)
        );
        
        console.log(`Saved data for ${symbol}`);
        
        // Prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing ${symbol}:`, error.message);
      }
    }
    
    // Save list of all stocks
    fs.writeFileSync(
      path.join(DATA_DIR, 'stocks-list.json'),
      JSON.stringify({
        stocks: allStocks,
        lastUpdated: new Date()
      }, null, 2)
    );
    
    console.log('Stock data update completed');
  } catch (error) {
    console.error('Error updating stock data:', error);
  }
}

/**
 * Update cryptocurrency data files
 */
async function updateCryptoData() {
  try {
    console.log('Updating cryptocurrency data...');
    
    // Create array to hold all crypto data
    const allCryptos = [];
    
    // Process each cryptocurrency
    for (const coinId of CRYPTOCURRENCIES) {
      try {
        console.log(`Fetching data for ${coinId}...`);
        const cryptoData = await cryptoService.getCryptoData(coinId);
        
        // Add to all cryptos array
        allCryptos.push({
          coinId: cryptoData.coinId,
          symbol: cryptoData.symbol,
          name: cryptoData.name,
          price: cryptoData.price,
          change24h: cryptoData.change24h,
          changePercent24h: cryptoData.changePercent24h,
          marketCap: cryptoData.marketCap,
          lastUpdated: cryptoData.lastUpdated
        });
        
        // Save individual crypto data to file
        fs.writeFileSync(
          path.join(DATA_DIR, `crypto-${cryptoData.coinId}.json`),
          JSON.stringify(cryptoData, null, 2)
        );
        
        console.log(`Saved data for ${coinId}`);
        
        // Prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 6000));
      } catch (error) {
        console.error(`Error processing ${coinId}:`, error.message);
      }
    }
    
    // Save list of all cryptocurrencies
    fs.writeFileSync(
      path.join(DATA_DIR, 'cryptos-list.json'),
      JSON.stringify({
        cryptos: allCryptos,
        lastUpdated: new Date()
      }, null, 2)
    );
    
    console.log('Cryptocurrency data update completed');
  } catch (error) {
    console.error('Error updating cryptocurrency data:', error);
  }
}

// Run updates
async function main() {
  try {
    await updateStockData();
    await updateCryptoData();
    
    // Create metadata file with last update timestamp
    fs.writeFileSync(
      path.join(DATA_DIR, 'metadata.json'),
      JSON.stringify({
        lastUpdated: new Date(),
        stockCount: INDIAN_STOCKS.length,
        cryptoCount: CRYPTOCURRENCIES.length
      }, null, 2)
    );
    
    console.log('All data updates completed');
    
    // Close MongoDB connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
}

main(); 