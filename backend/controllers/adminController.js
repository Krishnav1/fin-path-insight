// backend/controllers/adminController.js
// Controller for admin panel functionality

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';
import { updateKnowledgeBase } from '../utils/knowledgeBaseManager.js';

// Configure paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const documentsDir = path.join(__dirname, '../data/documents');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // Ensure documents directory exists
      await fs.mkdir(documentsDir, { recursive: true });
      cb(null, documentsDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = file.originalname.replace(fileExtension, '') + '-' + uniqueSuffix + fileExtension;
    cb(null, fileName);
  }
});

// Create multer upload instance
export const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only PDF, CSV, and TXT files
    const allowedTypes = ['.pdf', '.csv', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, CSV, and TXT files are allowed'));
    }
  }
});

/**
 * Get admin dashboard data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAdminDashboard = async (req, res) => {
  try {
    // Get list of documents
    const files = await fs.readdir(documentsDir);
    
    // Get file stats
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(documentsDir, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          lastModified: stats.mtime,
          type: path.extname(file).substring(1).toUpperCase()
        };
      })
    );
    
    // Return dashboard data
    res.json({
      documents: fileStats,
      totalDocuments: fileStats.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting admin dashboard data:', error);
    res.status(500).json({ error: 'Failed to get admin dashboard data' });
  }
};

/**
 * Upload document to knowledge base
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('File uploaded successfully:', req.file.filename);
    
    res.json({
      success: true,
      file: {
        name: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      message: 'File uploaded successfully. You can now update the knowledge base to process it.'
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
};

/**
 * Update knowledge base
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateKnowledgeBaseHandler = async (req, res) => {
  try {
    console.log('Starting knowledge base update from admin panel');
    
    // Start the update process
    const updateResult = await updateKnowledgeBase();
    
    res.json({
      success: true,
      result: updateResult,
      message: 'Knowledge base update completed successfully'
    });
  } catch (error) {
    console.error('Error updating knowledge base:', error);
    res.status(500).json({ 
      error: 'Failed to update knowledge base',
      details: error.message
    });
  }
};

/**
 * Delete document from knowledge base
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    const filePath = path.join(documentsDir, filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Delete the file
    await fs.unlink(filePath);
    
    res.json({
      success: true,
      message: `Document ${filename} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};
