// backend/routes/knowledgeBaseRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import updateKnowledgeBase from '../scripts/updateKnowledgeBase.js';
import { processPdfDocument, processCsvDocument } from '../utils/documentProcessor.js';

const router = express.Router();

// Configure paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDirectory = path.join(__dirname, '../../data');
const sourcesDirectory = path.join(dataDirectory, 'sources');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.access(sourcesDirectory);
  } catch (error) {
    await fs.mkdir(sourcesDirectory, { recursive: true });
    console.log(`Created directory: ${sourcesDirectory}`);
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    await ensureDirectories();
    cb(null, sourcesDirectory);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf' && ext !== '.csv') {
      return cb(new Error('Only PDF and CSV files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Route to upload a document
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const category = req.body.category || 'general_finance';
    const ext = path.extname(filePath).toLowerCase();
    
    let result;
    if (ext === '.pdf') {
      result = await processPdfDocument(filePath, category);
    } else if (ext === '.csv') {
      result = await processCsvDocument(filePath, category);
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported file type' });
    }
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Document processed successfully',
        documentId: result.documentId,
        chunks: result.chunks
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to process document',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing document',
      error: error.message
    });
  }
});

// Route to trigger knowledge base update
router.post('/update', async (req, res) => {
  try {
    const result = await updateKnowledgeBase();
    return res.status(200).json({
      success: true,
      message: 'Knowledge base update completed',
      result
    });
  } catch (error) {
    console.error('Error updating knowledge base:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating knowledge base',
      error: error.message
    });
  }
});

// Route to get knowledge base status
router.get('/status', async (req, res) => {
  try {
    await ensureDirectories();
    
    // Count files in sources directory
    const sourceFiles = await fs.readdir(sourcesDirectory);
    const pendingFiles = sourceFiles.length;
    
    // Get last update log
    const logsDirectory = path.join(dataDirectory, 'logs');
    let lastUpdate = null;
    
    try {
      await fs.access(logsDirectory);
      const logFiles = await fs.readdir(logsDirectory);
      
      if (logFiles.length > 0) {
        // Sort log files by name (which includes timestamp)
        logFiles.sort().reverse();
        const lastLogFile = path.join(logsDirectory, logFiles[0]);
        const logContent = await fs.readFile(lastLogFile, 'utf8');
        lastUpdate = JSON.parse(logContent);
      }
    } catch (error) {
      console.error('Error reading logs directory:', error);
    }
    
    return res.status(200).json({
      success: true,
      pendingFiles,
      lastUpdate
    });
  } catch (error) {
    console.error('Error getting knowledge base status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting knowledge base status',
      error: error.message
    });
  }
});

export default router;
