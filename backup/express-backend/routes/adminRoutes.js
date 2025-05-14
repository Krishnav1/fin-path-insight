// backend/routes/adminRoutes.js
// Routes for admin panel functionality

import express from 'express';
import { getAdminDashboard, uploadDocument, updateKnowledgeBaseHandler, deleteDocument, upload } from '../controllers/adminController.js';

const router = express.Router();

// Admin dashboard route
router.get('/dashboard', getAdminDashboard);

// Upload document route
router.post('/upload', upload.single('document'), uploadDocument);

// Update knowledge base route
router.post('/update-knowledge-base', updateKnowledgeBaseHandler);

// Delete document route
router.delete('/documents/:filename', deleteDocument);

export default router;
