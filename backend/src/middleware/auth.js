// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    try {
        let token;

        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                message: "Not authorized to access this resource. Please log in."
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const currentUser = await User.findById(decoded.id).select('-password');

            if (!currentUser) {
                return res.status(401).json({ message: "The user belonging to this token no longer exists." });
            }

            req.user = currentUser;

            next();

        } catch (jwtError) {
            return res.status(401).json({ message: "Session expired or invalid token. Please log in again." });
        }

    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return res.status(500).json({ message: "Internal server error during authorization verification." });
    }
};

export const authorizeAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
};
