// src/routes/userRoutes.js
import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { 
    getUserProfile, 
    updateUserProfile, 
    getMyListings 
} from '../controllers/userController.js';
import upload from '../middleware/upload.js';

const router = Router();

// Protected routes (requires authentication)

// GET /api/users/profile - Get current user profile
router.get('/profile', protect, getUserProfile);

// PUT /api/users/profile - Update current user profile
router.put('/profile', protect,upload.single('profilePicture'), updateUserProfile);

// GET /api/users/my-listings - Get listings for current user
router.get('/my-listings', protect, getMyListings);

export default router;