// backend/utils/cronScheduler.js
// Enhanced implementation for cron job scheduler with knowledge base updates

import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateKnowledgeBase } from './knowledgeBaseManager.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log cron job execution
 * @param {string} jobName - Name of the cron job
 * @param {string} message - Message to log
 */
function logCronJob(jobName, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${jobName}: ${message}\n`;
  
  // Log to console
  console.log(logMessage);
  
  // Log to file
  const logFile = path.join(logsDir, `${jobName}.log`);
  fs.appendFileSync(logFile, logMessage);
}

/**
 * Initialize cron jobs
 */
export function initializeCronJobs() {
  console.log('Initializing cron jobs...');
  
  // Schedule weekly knowledge base update (Monday at 6 AM)
  cron.schedule('0 6 * * 1', async () => {
    try {
      logCronJob('knowledge-base-update', 'Starting weekly knowledge base update');
      
      // Call the actual knowledge base update function
      const result = await updateKnowledgeBase();
      
      if (result.success) {
        logCronJob('knowledge-base-update', `Successfully updated knowledge base: ${result.documentsProcessed} documents processed`);
      } else {
        logCronJob('knowledge-base-update', `Failed to update knowledge base: ${result.error}`);
      }
    } catch (error) {
      logCronJob('knowledge-base-update', `Error during knowledge base update: ${error.message}`);
    }
  });
  
  console.log('Cron jobs initialized successfully');
}

export default {
  initializeCronJobs
};
