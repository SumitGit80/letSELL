// src/routes/categoryRoutes.js
import express from 'express';
import { getAllCategories } from '../controllers/categoryController.js';

const router = express.Router();

// GET request to fetch all categories
// Route: GET /api/categories/
router.get('/', getAllCategories);

export default router;