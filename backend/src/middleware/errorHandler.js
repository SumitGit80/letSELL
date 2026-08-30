// src/middleware/errorHandler.js

export const errorHandler = (err, req, res, next) => {
    // Default to 500 server error if status code is not already set
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // 1. Mongoose Bad ObjectId (Cast Error)
    if (err.name === 'CastError') {
        message = `Resource not found. Invalid: ${err.path}`;
        statusCode = 404;
    }

    // 2. Mongoose Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        message = `Duplicate ${field} entered. This ${field} already exists.`;
        statusCode = 400;
    }

    // 3. Mongoose Validation Error
    if (err.name === 'ValidationError') {
        message = Object.values(err.errors).map((val) => val.message).join(', ');
        statusCode = 400;
    }

    // 4. JWT (JSON Web Token) Errors
    if (err.name === 'JsonWebTokenError') {
        message = 'Invalid session token. Please log in again.';
        statusCode = 401;
    }

    if (err.name === 'TokenExpiredError') {
        message = 'Your session has expired. Please log in again.';
        statusCode = 401;
    }

    // Final JSON Response
    res.status(statusCode).json({
        message: message,
        // Hide stack trace in production for security
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Pass error to global handler
};