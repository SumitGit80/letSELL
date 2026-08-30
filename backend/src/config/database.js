// src/config/database.js
import mongoose from 'mongoose';

/**
 * Establishes a connection to the MongoDB instance.
 * Centralizing this lifecycle allows us to call it safely inside server.js.
 */
const connectDB = async () => {
    try {
        // Ensure connection string is provided
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables.');
        }

        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`🍃 MongoDB Connected successfully!`);
        console.log(`🖥️  Database Host: ${connectionInstance.connection.host}`);
        console.log(`📦 Database Name: ${connectionInstance.connection.name}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        throw error; 
    }
};

export default connectDB;