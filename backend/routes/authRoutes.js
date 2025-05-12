import express from 'express';
import { signup, login, verifyEmail, resendVerificationOTP } from '../controllers/authController.js';

const router = express.Router();

// Authentication routes
router.post('/signup', signup);
router.post('/login', login);

// Email verification routes
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationOTP);

export default router;
