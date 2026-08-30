// src/routes/authRoutes.js
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {protect} from '../middleware/auth.js';
import {
    initiateSignup,
    verifyOtp,
    login,
    logout,
    forgotPassword,
    resetPassword,
    changePassword
} from '../controllers/authController.js';

const router = Router();

// Configure a common strict rate limiting rule for all auth attempts
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minute window block
    max: 20,                   // Limit each IP to 20 requests per window (shared across all routes using this limiter)
    message: {
        message: "Too many authentication attempts from this IP. Please try again after 15 minutes."
    },
    standardHeaders: true,    // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,     // Disable X-RateLimit-* headers
});

// Apply the common limiter to routes that generate emails or verify credentials/OTPs
router.post('/register-initiate', authLimiter, initiateSignup);
router.post('/register-verify', authLimiter, verifyOtp);
router.post('/login', authLimiter, login);

// Logout does not need rate limiting
router.post('/logout', logout);

// Apply the common limiter to password reset routes
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/change-password', authLimiter, protect, changePassword);

export default router;