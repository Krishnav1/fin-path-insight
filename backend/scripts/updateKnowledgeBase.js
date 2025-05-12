// backend/scripts/updateKnowledgeBase.js
import { processDirectory } from '../utils/documentProcessor.js';
import { initializePinecone } from '../utils/pineconeClient.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configure paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDirectory = path.join(__dirname, '../../data');
const sourcesDirectory = path.join(dataDirectory, 'sources');
const processedDirectory = path.join(dataDirectory, 'processed');
const logsDirectory = path.join(dataDirectory, 'logs');

/**
 * Ensure all required directories exist
 */
async function ensureDirectories() {
  const directories = [dataDirectory, sourcesDirectory, processedDirectory, logsDirectory];
  
  for (const dir of directories) {
    try {
      await fs.access(dir);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
}

/**
 * Move processed files to the processed directory
 * @param {Array} processedFiles - List of successfully processed files
 */
async function moveProcessedFiles(processedFiles) {
  for (const file of processedFiles) {
    const sourcePath = path.join(sourcesDirectory, file);
    const destinationPath = path.join(processedDirectory, file);
    
    try {
      await fs.rename(sourcePath, destinationPath);
      console.log(`Moved processed file: ${file}`);
    } catch (error) {
      console.error(`Error moving file ${file}:`, error);
    }
  }
}

/**
 * Log the update results
 * @param {Object} results - Results of the update process
 */
async function logUpdateResults(results) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const logFile = path.join(logsDirectory, `update_${timestamp}.json`);
  
  try {
    await fs.writeFile(logFile, JSON.stringify(results, null, 2));
    console.log(`Update log saved to: ${logFile}`);
  } catch (error) {
    console.error('Error writing log file:', error);
  }
}

/**
 * Main function to update the knowledge base
 */
async function updateKnowledgeBase() {
  console.log('Starting knowledge base update...');
  
  try {
    // Ensure directories exist
    await ensureDirectories();
    
    // Initialize Pinecone
    await initializePinecone();
    
    // Process all documents in the sources directory
    const results = await processDirectory(sourcesDirectory);
    
    // Move successfully processed files
    if (results.processed > 0) {
      const processedFiles = results.details
        .filter(detail => detail.success)
        .map(detail => detail.file);
      
      await moveProcessedFiles(processedFiles);
    }
    
    // Log results
    await logUpdateResults(results);
    
    console.log('Knowledge base update completed successfully');
    console.log(`Processed ${results.processed} files, ${results.failed} failed`);
    
    return results;
  } catch (error) {
    console.error('Error updating knowledge base:', error);
    return { success: false, error: error.message };
  }
}

// Run the update if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  updateKnowledgeBase()
    .then(() => {
      console.log('Update script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Update script failed:', error);
      process.exit(1);
    });
}

export default updateKnowledgeBase;
