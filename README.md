# letSell

A full-stack campus marketplace application designed for students to buy, sell, and trade items within their college/university environment.

## Features

- **User Authentication:** Secure JWT-based authentication with HttpOnly cookies.
- **Student Profiles:** Profiles tailored for students (Hostel, Room Number, Graduation Year, Branch, Roll Number).
- **Product Listings:** Create, edit, and delete product listings.
- **Image Uploads:** Upload multiple images per product, stored securely on Cloudinary.
- **Listing Status:** Sellers can mark their items as Active, Sold, or Inactive.
- **Search & Filtering:** MongoDB Atlas Search integration for fast, fuzzy searching and category filtering.
- **Admin Dashboard:** (Work in progress) Admin capabilities to moderate users and view all listings.

## Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS v4
- React Router DOM v7
- Axios (for API requests)

### Backend
- Node.js & Express
- MongoDB & Mongoose
- JSON Web Tokens (JWT) for Auth
- Bcrypt (Password hashing)
- Zod (Request payload validation)
- Cloudinary & Multer (Image processing and storage)
- Nodemailer (Email/OTP services)

## Project Structure

```
letSell/
├── backend/       # Express.js backend API
└── frontend/      # React Vite frontend app
```

## Setup Instructions

### 1. Backend Setup
1. Navigate to the `backend/` directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file in the `backend/` directory with the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```
4. Start the backend development server: `npm run dev`

### 2. Frontend Setup
1. Navigate to the `frontend/` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the frontend development server: `npm run dev`

The frontend will start (usually on `http://localhost:5173`) and will proxy requests or point directly to the backend API.
