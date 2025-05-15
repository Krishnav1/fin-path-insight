import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const marketData = [
  // Stocks
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 175.04,
    change: 2.34,
    changePercent: 1.35,
    volume: 52345678,
    type: 'stock',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 415.32,
    change: 5.67,
    changePercent: 1.38,
    volume: 23456789,
    type: 'stock',
  },
  // Crypto
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 64356.19,
    change: 1508.22,
    changePercent: 2.40,
    volume: 456789012,
    type: 'crypto',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3089.48,
    change: 43.38,
    changePercent: 1.42,
    volume: 234567890,
    type: 'crypto',
  },
  // Forex
  {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    price: 1.0728,
    change: 0.0012,
    changePercent: 0.11,
    volume: 123456789,
    type: 'forex',
  },
  {
    symbol: 'USD/JPY',
    name: 'US Dollar / Japanese Yen',
    price: 151.58,
    change: -0.22,
    changePercent: -0.14,
    volume: 98765432,
    type: 'forex',
  },
  // Commodities
  {
    symbol: 'GOLD',
    name: 'Gold',
    price: 2369.75,
    change: 23.40,
    changePercent: 0.99,
    volume: 34567890,
    type: 'commodity',
  },
  {
    symbol: 'SILVER',
    name: 'Silver',
    price: 31.54,
    change: 0.47,
    changePercent: 1.51,
    volume: 23456789,
    type: 'commodity',
  },
];

async function seedMarketData() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('market_data');

    // Clear existing data
    await collection.deleteMany({});

    // Insert new data
    const result = await collection.insertMany(marketData);
    console.log(`Inserted ${result.insertedCount} documents`);

  } catch (error) {
    console.error('Error seeding market data:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

seedMarketData(); 