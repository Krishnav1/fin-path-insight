// backend/routes/aiAnalysisRoutes.js
import express from 'express';
import { handleCompanyAnalysis } from '../controllers/aiAnalysisController.js';

const router = express.Router();

/**
 * @route   POST /api/ai-analysis/company
 * @desc    Generate AI analysis for a company
 * @access  Public
 */
router.post('/company', handleCompanyAnalysis);

export default router;
