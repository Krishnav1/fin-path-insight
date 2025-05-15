// Script to update the knowledge base with better memory management
import { updateKnowledgeBase } from '../utils/knowledgeBaseManager.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

// Configure dotenv to load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// Create logs directory if it doesn't exist
const logsDir = join(__dirname, '../logs');
try {
  await fs.mkdir(logsDir, { recursive: true });
  console.log(`Ensured logs directory exists: ${logsDir}`);
} catch (error) {
  console.error(`Error creating logs directory: ${error.message}`);
}

// Log function
async function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // Log to console
  console.log(message);
  
  // Log to file
  const logFile = join(logsDir, `knowledge-base-update-${new Date().toISOString().split('T')[0]}.log`);
  try {
    await fs.appendFile(logFile, logMessage);
  } catch (error) {
    console.error(`Error writing to log file: ${error.message}`);
  }
}

// Monitor memory usage
function logMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  return `Memory Usage: RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB, Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB, Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`;
}

// Main function to update knowledge base
async function main() {
  try {
    await logToFile('Starting knowledge base update script...');
    await logToFile(logMemoryUsage());
    
    // Update knowledge base
    await logToFile('Calling updateKnowledgeBase function...');
    const result = await updateKnowledgeBase();
    
    await logToFile(logMemoryUsage());
    
    if (result.success) {
      await logToFile(`Knowledge base update completed successfully. ${result.documentsProcessed} documents processed.`);
      await logToFile(`Message: ${result.message}`);
    } else {
      await logToFile(`Knowledge base update failed: ${result.error}`);
    }
  } catch (error) {
    await logToFile(`Error in knowledge base update script: ${error.message}`);
    console.error(error);
  } finally {
    await logToFile('Knowledge base update script finished.');
    await logToFile(logMemoryUsage());
  }
}

// Run the main function
main().then(() => {
  console.log('Script execution completed.');
  process.exit(0);
}).catch(error => {
  console.error('Unhandled error in script execution:', error);
  process.exit(1);
});
