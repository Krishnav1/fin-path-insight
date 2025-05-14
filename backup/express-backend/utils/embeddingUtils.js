// backend/utils/embeddingUtils.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Configure dotenv to load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// Access Gemini API key
const apiKey = process.env.GEMINI_API_KEY;

// Initialize Google Generative AI client
let genAI = null;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('Google Generative AI client initialized for embeddings');
  } catch (error) {
    console.error('Error initializing Google Generative AI client for embeddings:', error);
  }
}

/**
 * Generate embedding for a text using Google's embedding model
 * @param {string} text - The text to generate embedding for
 * @returns {Array} - The embedding vector
 */
export async function generateEmbedding(text) {
  if (!genAI) {
    throw new Error('Google Generative AI client not initialized');
  }

  try {
    // Use the embedding model to generate embeddings
    const embeddingModel = genAI.getGenerativeModel({
      model: "embedding-001"
    });
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Split text into chunks of specified size
 * @param {string} text - The text to split
 * @param {number} chunkSize - Maximum size of each chunk
 * @param {number} overlap - Number of characters to overlap between chunks
 * @returns {Array} - Array of text chunks
 */
export function splitTextIntoChunks(text, chunkSize = 800, overlap = 100) {
  const chunks = [];
  let i = 0;

  while (i < text.length) {
    // Calculate end position for this chunk
    let end = Math.min(i + chunkSize, text.length);
    
    // If we're not at the end of the text and not at a sentence boundary,
    // try to find a sentence boundary to end the chunk
    if (end < text.length) {
      // Look for sentence boundaries (., !, ?) followed by a space or newline
      const sentenceEnd = text.substring(i, end).search(/[.!?][\s\n]/g);
      if (sentenceEnd !== -1) {
        // Add 2 to include the punctuation and the space/newline
        end = i + sentenceEnd + 2;
      }
    }

    // Add the chunk to our array
    chunks.push(text.substring(i, end));
    
    // Move to the next position, accounting for overlap
    i = end - overlap;
    
    // Make sure we're making progress
    if (i <= 0) i = end;
  }

  return chunks;
}

/**
 * Generate a document ID from text content
 * @param {string} text - The text content
 * @returns {string} - A unique document ID
 */
export function generateDocumentId(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

/**
 * Prepare chunks for vector storage with memory optimization
 * @param {string} text - The full text
 * @param {string} source - Source of the document
 * @param {string} category - Category of the document
 * @param {number} maxChunks - Maximum number of chunks to process (default: 100)
 * @returns {Array} - Array of prepared chunks with embeddings
 */
export async function prepareChunksForVectorStorage(text, source, category, maxChunks = 100) {
  // Split text into chunks
  const chunks = splitTextIntoChunks(text);
  console.log(`Split text into ${chunks.length} chunks`);
  
  // Limit number of chunks to prevent memory issues
  const chunksToProcess = chunks.length > maxChunks ? chunks.slice(0, maxChunks) : chunks;
  
  if (chunks.length > maxChunks) {
    console.log(`Limiting processing to ${maxChunks} chunks out of ${chunks.length} total chunks`);
  }
  
  const preparedChunks = [];
  const documentId = generateDocumentId(source);

  // Process chunks in batches to avoid memory issues
  const BATCH_SIZE = 10;
  
  for (let batchStart = 0; batchStart < chunksToProcess.length; batchStart += BATCH_SIZE) {
    console.log(`Processing batch starting at chunk ${batchStart}`);
    
    // Get the current batch of chunks
    const batch = chunksToProcess.slice(batchStart, batchStart + BATCH_SIZE);
    
    // Process each chunk in the batch
    const batchPromises = batch.map(async (chunk, index) => {
      const chunkIndex = batchStart + index;
      const chunkId = `${documentId}_chunk_${chunkIndex}`;
      
      try {
        // Generate embedding for the chunk
        const embedding = await generateEmbedding(chunk);
        
        return {
          id: chunkId,
          values: embedding,
          metadata: {
            text: chunk,
            source: source,
            category: category,
            chunkIndex: chunkIndex,
            totalChunks: chunksToProcess.length,
            truncated: chunks.length > maxChunks,
            processingDate: new Date().toISOString()
          }
        };
      } catch (error) {
        console.error(`Error processing chunk ${chunkIndex}:`, error);
        return null;
      }
    });
    
    // Wait for all chunks in the batch to be processed
    const batchResults = await Promise.all(batchPromises);
    
    // Add successful results to preparedChunks
    preparedChunks.push(...batchResults.filter(result => result !== null));
    
    // Force garbage collection between batches (if possible)
    if (global.gc) {
      try {
        global.gc();
        console.log('Garbage collection triggered');
      } catch (e) {
        console.log('Could not force garbage collection');
      }
    }
  }

  console.log(`Successfully prepared ${preparedChunks.length} chunks for vector storage`);
  return preparedChunks;
}

export default {
  generateEmbedding,
  splitTextIntoChunks,
  generateDocumentId,
  prepareChunksForVectorStorage
};
