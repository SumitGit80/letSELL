// src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
// Import custom global error middleware
// import errorHandler from './middleware/errorHandler.js';

// Import route groups
import authRoutes from './routes/authRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler,notFound } from './middleware/errorHandler.js';

const app = express();

app.use(express.static('public'));
// ==========================================
// 🛠️ GLOBAL MIDDLEWARES
// ==========================================

// Configure CORS
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true // Allow session cookies
}));

// Parse JSON payloads
app.use(express.json());

// Parse cookies
app.use(cookieParser());

// ==========================================
// 🛣️ API ENDPOINTS & ROUTING
// ==========================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'OLX Clone API is running smoothly' });
});

// Route definitions
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);

// ==========================================
// 🚨 GLOBAL ERROR HANDLING
// ==========================================

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;