import axios from 'axios';

// Create a centralized Axios instance
const apiClient = axios.create({
    baseURL: 'http://localhost:5000/api', // Adjust if your backend port is different
    withCredentials: true, // Crucial: Allows browser to send HttpOnly cookies securely 
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;