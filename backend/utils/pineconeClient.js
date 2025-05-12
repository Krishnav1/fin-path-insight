// backend/utils/pineconeClient.js
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configure dotenv to load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// Access Pinecone API key and configuration
const apiKey = process.env.PINECONE_API_KEY;
const indexName = process.env.PINECONE_INDEX_NAME || 'fingenie-finance-vectors';
const cloud = process.env.PINECONE_CLOUD || 'aws';
const region = process.env.PINECONE_REGION || 'us-east-1';

// Initialize Pinecone client
let pineconeClient = null;
let pineconeIndex = null;

/**
 * Initialize the Pinecone client and create index if it doesn't exist
 */
export async function initializePinecone() {
  if (!apiKey) {
    console.error('PINECONE_API_KEY is missing in .env file');
    return null;
  }

  try {
    console.log('Initializing Pinecone client...');
    pineconeClient = new Pinecone({
      apiKey: apiKey
    });

    // Check if index exists
    const { indexes } = await pineconeClient.listIndexes();
    const indexExists = indexes.some(idx => idx.name === indexName);

    if (!indexExists) {
      console.log(`Creating new Pinecone index: ${indexName}`);
      await pineconeClient.createIndex({
        name: indexName,
        dimension: 768, // Dimension for embedding-001 model
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: cloud,
            region: region
          }
        }
      });
      
      // Wait for index to be ready
      console.log('Waiting for index to initialize...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds
    }

    // Connect to the index
    pineconeIndex = pineconeClient.index(indexName);
    console.log('Pinecone index connected successfully');
    return pineconeIndex;
  } catch (error) {
    console.error('Error initializing Pinecone:', error);
    return null;
  }
}

/**
 * Get the Pinecone index instance
 */
export function getPineconeIndex() {
  if (!pineconeIndex) {
    console.warn('Pinecone index not initialized, attempting to initialize now...');
    return initializePinecone();
  }
  return pineconeIndex;
}

/**
 * Store embeddings in Pinecone
 * @param {Array} vectors - Array of vectors with id, values, and metadata
 */
export async function storeEmbeddings(vectors) {
  const index = await getPineconeIndex();
  if (!index) {
    console.error('Failed to get Pinecone index');
    return false;
  }

  try {
    // Upsert vectors in batches of 100
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
    }
    console.log(`Successfully stored ${vectors.length} vectors in Pinecone`);
    return true;
  } catch (error) {
    console.error('Error storing embeddings in Pinecone:', error);
    return false;
  }
}

/**
 * Query Pinecone for similar vectors
 * @param {Array} queryEmbedding - The embedding vector to query with
 * @param {Number} topK - Number of results to return
 * @param {Object} filter - Optional metadata filter
 */
export async function querySimilarVectors(queryEmbedding, topK = 5, filter = null) {
  const index = await getPineconeIndex();
  if (!index) {
    console.error('Failed to get Pinecone index');
    return [];
  }

  try {
    // Create query parameters without filter by default
    const queryParams = {
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true
    };
    
    // Only add filter if it's provided and not empty
    if (filter && Object.keys(filter).length > 0) {
      queryParams.filter = filter;
    }
    
    console.log('Querying Pinecone with params:', JSON.stringify(queryParams));
    const queryResponse = await index.query(queryParams);

    return queryResponse.matches || [];
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    return [];
  }
}

// Initialize Pinecone on module import
initializePinecone().catch(error => {
  console.error('Failed to initialize Pinecone on startup:', error);
});

export default {
  initializePinecone,
  getPineconeIndex,
  storeEmbeddings,
  querySimilarVectors
};
