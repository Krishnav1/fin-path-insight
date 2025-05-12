// backend/utils/knowledgeBaseManager.js
// Handles knowledge base updates and management

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { processPdfDocument, processCsvDocument, processTextDocument } from './documentProcessor.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the documents directory
const documentsDir = path.join(__dirname, '../data/documents');

/**
 * Update the knowledge base by processing all documents in the documents directory
 * @returns {Promise<Object>} - Result of the update operation
 */
export async function updateKnowledgeBase() {
  try {
    console.log('Starting knowledge base update...');
    
    // Ensure documents directory exists
    try {
      await fs.mkdir(documentsDir, { recursive: true });
      console.log(`Ensured documents directory exists: ${documentsDir}`);
    } catch (dirError) {
      console.error(`Error creating documents directory: ${dirError.message}`);
    }
    
    // Get all files in the documents directory
    const files = await fs.readdir(documentsDir);
    console.log(`Found ${files.length} files in documents directory`);
    
    if (files.length === 0) {
      return {
        success: true,
        documentsProcessed: 0,
        message: 'No documents found to process'
      };
    }
    
    // Process files in batches to avoid memory issues
    const BATCH_SIZE = 3; // Process only a few files at a time
    let successCount = 0;
    let errorCount = 0;
    
    // Group files by type to process smaller files first
    const filesByType = {
      txt: [],
      csv: [],
      pdf: [] // Process PDFs last as they're typically larger
    };
    
    // Categorize files by extension
    for (const file of files) {
      const fileExt = path.extname(file).toLowerCase().substring(1); // Remove the dot
      if (filesByType[fileExt] !== undefined) {
        filesByType[fileExt].push(file);
      } else {
        console.log(`Unsupported file type: ${file}`);
      }
    }
    
    // Process files by type, starting with smaller file types
    const fileTypes = Object.keys(filesByType);
    for (const fileType of fileTypes) {
      const typeFiles = filesByType[fileType];
      console.log(`Processing ${typeFiles.length} ${fileType} files`);
      
      // Process files in batches
      for (let i = 0; i < typeFiles.length; i += BATCH_SIZE) {
        const batch = typeFiles.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch of ${batch.length} ${fileType} files (${i+1} to ${Math.min(i+BATCH_SIZE, typeFiles.length)} of ${typeFiles.length})`);
        
        // Process each file in the batch
        for (const file of batch) {
          const filePath = path.join(documentsDir, file);
          
          try {
            // Check file size before processing
            const stats = await fs.stat(filePath);
            const fileSizeInMB = stats.size / (1024 * 1024);
            console.log(`File size of ${file}: ${fileSizeInMB.toFixed(2)} MB`);
            
            // Skip extremely large files
            const MAX_FILE_SIZE_MB = 50;
            if (fileSizeInMB > MAX_FILE_SIZE_MB) {
              console.log(`Skipping extremely large file: ${file} (${fileSizeInMB.toFixed(2)} MB)`);
              errorCount++;
              continue;
            }
            
            // Determine file category based on filename
            let category = 'general_finance';
            
            if (file.includes('market') || file.includes('stock')) {
              category = 'market_report';
            } else if (file.includes('news')) {
              category = 'financial_news';
            } else if (file.includes('analysis')) {
              category = 'financial_analysis';
            } else if (file.includes('investment')) {
              category = 'investment_strategy';
            }
            
            // Process based on file extension
            let result;
            const fileExt = path.extname(file).toLowerCase();
            
            if (fileExt === '.pdf') {
              result = await processPdfDocument(filePath, category);
            } else if (fileExt === '.csv') {
              result = await processCsvDocument(filePath, category);
            } else if (fileExt === '.txt') {
              result = await processTextDocument(filePath, category);
            } else {
              console.log(`Skipping unsupported file type: ${file}`);
              continue;
            }
            
            if (result.success) {
              successCount++;
              console.log(`Successfully processed ${file}`);
            } else {
              errorCount++;
              console.error(`Failed to process ${file}: ${result.error || 'Unknown error'}`);
            }
          } catch (fileError) {
            errorCount++;
            console.error(`Error processing file ${file}: ${fileError.message}`);
          }
          
          // Force garbage collection between files if possible
          if (global.gc) {
            try {
              global.gc();
              console.log('Garbage collection triggered between files');
            } catch (e) {
              console.log('Could not force garbage collection');
            }
          }
        }
        
        // Add a small delay between batches to allow for memory cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Knowledge base update completed. Processed ${successCount} files successfully, ${errorCount} with errors.`);
    
    return {
      success: true,
      documentsProcessed: successCount,
      errors: errorCount,
      message: `Processed ${successCount} documents successfully, ${errorCount} with errors.`
    };
  } catch (error) {
    console.error('Error updating knowledge base:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get the status of the knowledge base
 * @returns {Promise<Object>} - Status of the knowledge base
 */
export async function getKnowledgeBaseStatus() {
  try {
    // Ensure documents directory exists
    try {
      await fs.mkdir(documentsDir, { recursive: true });
    } catch (dirError) {
      console.error(`Error creating documents directory: ${dirError.message}`);
    }
    
    // Get all files in the documents directory
    const files = await fs.readdir(documentsDir);
    
    // Count files by type
    const fileTypes = {};
    for (const file of files) {
      const fileExt = path.extname(file).toLowerCase();
      fileTypes[fileExt] = (fileTypes[fileExt] || 0) + 1;
    }
    
    return {
      success: true,
      totalDocuments: files.length,
      fileTypes
    };
  } catch (error) {
    console.error('Error getting knowledge base status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
