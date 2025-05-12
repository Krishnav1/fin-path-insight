import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env');
}

async function testConnection() {
  if (!MONGODB_URI) {
    throw new Error('MongoDB URI is not defined');
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Successfully connected to MongoDB!');
    
    // List all collections in the database
    const collections = await client.db().listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    await client.close();
  }
}

// Run the test
testConnection(); 