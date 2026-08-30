// server.js
import 'dotenv/config'; // Initialize environment variables
import app from './src/app.js';
import connectDB from './src/config/database.js';

const PORT = process.env.PORT || 5000;

// Initialize database connection before starting the server
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server successfully spinning up on port: ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    })
    .catch((error) => {
        console.error('❌ Failed to establish initial database connection. Exiting process...', error);
        process.exit(1); // Exit process on database connection failure
    });