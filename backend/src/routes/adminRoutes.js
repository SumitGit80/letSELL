// src/routes/adminRoutes.js
import { Router } from 'express';
import { protect, authorizeAdmin } from '../middleware/auth.js';
import { getAllUsers, deleteUser, getAllListingsAdmin } from '../controllers/adminController.js';

const router = Router();

// All routes require authentication and admin role
router.use(protect, authorizeAdmin);

// GET /api/admin/users - List all users with pagination
router.get('/users', getAllUsers);

// DELETE /api/admin/users/:id - Hard-delete a user
router.delete('/users/:id', deleteUser);

// GET /api/admin/listings - List all listings regardless of status
router.get('/listings', getAllListingsAdmin);

export default router;
