// backend/routes/fingenieRoutes.js
import express from 'express';
import { handleChat } from '../controllers/fingenieController.js';

const router = express.Router();

// We might add authentication middleware later if chats should be user-specific and secured
// import authMiddleware from '../middleware/authMiddleware.js';

// POST /api/fingenie/chat
// Example: router.post('/chat', authMiddleware, handleChat);
router.post('/chat', handleChat); // For now, let's keep it open for easier testing

export default router;
