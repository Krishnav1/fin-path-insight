// Simple script to process text documents and store them in Pinecone
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';
import crypto from 'crypto';

// Configure dotenv to load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Access API keys
const geminiApiKey = process.env.GEMINI_API_KEY;
const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexName = process.env.PINECONE_INDEX_NAME || 'fingenie-finance-vectors';

// Define the documents directory
const documentsDir = path.join(__dirname, '../data/documents');

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(geminiApiKey);

// Initialize Pinecone client
let pineconeClient = null;
let pineconeIndex = null;

async function initializePinecone() {
  try {
    console.log('Initializing Pinecone client...');
    pineconeClient = new Pinecone({
      apiKey: pineconeApiKey
    });

    // Get the index
    pineconeIndex = pineconeClient.Index(pineconeIndexName);
    console.log('Pinecone index initialized successfully');
    return pineconeIndex;
  } catch (error) {
    console.error('Error initializing Pinecone:', error);
    return null;
  }
}

// Generate embedding for text
async function generateEmbedding(text) {
  try {
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

// Split text into chunks
function splitTextIntoChunks(text, chunkSize = 800, overlap = 100) {
  const chunks = [];
  let i = 0;

  while (i < text.length) {
    let end = Math.min(i + chunkSize, text.length);
    
    if (end < text.length) {
      const sentenceEnd = text.substring(i, end).search(/[.!?][\\s\\n]/g);
      if (sentenceEnd !== -1) {
        end = i + sentenceEnd + 2;
      }
    }

    chunks.push(text.substring(i, end));
    i = end - overlap;
    
    if (i <= 0) i = end;
  }

  return chunks;
}

// Generate document ID
function generateDocumentId(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

// Process a text document
async function processTextDocument(filePath) {
  try {
    const fileName = path.basename(filePath);
    console.log(`Processing text document: ${fileName}`);
    
    // Read the text file
    const textContent = await fs.readFile(filePath, 'utf-8');
    console.log(`Successfully read text from file: ${fileName} (${textContent.length} characters)`);
    
    // Determine category based on filename
    let category = 'general_finance';
    if (fileName.includes('market') || fileName.includes('stock')) {
      category = 'market_report';
    } else if (fileName.includes('investment')) {
      category = 'investment_strategy';
    }
    
    // Split text into chunks
    const chunks = splitTextIntoChunks(textContent);
    console.log(`Split text into ${chunks.length} chunks`);
    
    // Process chunks in batches
    const BATCH_SIZE = 5;
    const documentId = generateDocumentId(fileName);
    let successCount = 0;
    
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, Math.min(i + BATCH_SIZE, chunks.length));
      console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(chunks.length / BATCH_SIZE)}`);
      
      const vectors = [];
      
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const chunkIndex = i + j;
        const chunkId = `${documentId}_chunk_${chunkIndex}`;
        
        try {
          // Generate embedding for the chunk
          const embedding = await generateEmbedding(chunk);
          
          vectors.push({
            id: chunkId,
            values: embedding,
            metadata: {
              text: chunk,
              source: fileName,
              category: category,
              chunkIndex: chunkIndex,
              totalChunks: chunks.length,
              processingDate: new Date().toISOString()
            }
          });
          
          successCount++;
        } catch (error) {
          console.error(`Error processing chunk ${chunkIndex}:`, error);
        }
      }
      
      // Store vectors in Pinecone
      if (vectors.length > 0) {
        try {
          await pineconeIndex.upsert(vectors);
          console.log(`Successfully stored ${vectors.length} vectors in Pinecone`);
        } catch (error) {
          console.error('Error storing vectors in Pinecone:', error);
        }
      }
      
      // Wait a bit between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`Successfully processed ${successCount} chunks from ${fileName}`);
    return { success: true, chunksProcessed: successCount };
  } catch (error) {
    console.error(`Error processing text document: ${filePath}`, error);
    return { success: false, error: error.message };
  }
}

// Main function
async function main() {
  try {
    console.log('Starting text document processing...');
    
    // Initialize Pinecone
    await initializePinecone();
    if (!pineconeIndex) {
      console.error('Failed to initialize Pinecone index');
      return;
    }
    
    // Ensure documents directory exists
    try {
      await fs.mkdir(documentsDir, { recursive: true });
      console.log(`Ensured documents directory exists: ${documentsDir}`);
    } catch (error) {
      console.error(`Error creating documents directory: ${error.message}`);
    }
    
    // Get all text files in the documents directory
    const files = await fs.readdir(documentsDir);
    const textFiles = files.filter(file => path.extname(file).toLowerCase() === '.txt');
    console.log(`Found ${textFiles.length} text files in documents directory`);
    
    if (textFiles.length === 0) {
      console.log('No text files found to process');
      return;
    }
    
    // Process each text file
    for (const file of textFiles) {
      const filePath = path.join(documentsDir, file);
      const result = await processTextDocument(filePath);
      
      if (result.success) {
        console.log(`Successfully processed ${file}: ${result.chunksProcessed} chunks processed`);
      } else {
        console.error(`Failed to process ${file}: ${result.error}`);
      }
    }
    
    console.log('Text document processing completed');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main().then(() => {
  console.log('Script execution completed');
  process.exit(0);
}).catch(error => {
  console.error('Unhandled error in script execution:', error);
  process.exit(1);
});
