import User from '../models/User.js';
import Listing from '../models/Listing.js';
import { uploadBufferToCloudinary, deleteFromCloudinary  } from '../services/imageService.js';
import mongoose from 'mongoose';

// @desc    Get logged-in user profile
export const getUserProfile = async (req, res) => {
    const userProfile = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        hostel: req.user.hostel,
        roomNumber: req.user.roomNumber,
        branch: req.user.branch,
        graduationYear: req.user.graduationYear,
        rollNumber: req.user.rollNumber,
        profilePicture: req.user.profilePicture,
        createdAt: req.user.createdAt
    };
    
    res.status(200).json({ user: userProfile });
};

// @desc    Get all listings posted by the logged-in user
export const getMyListings = async (req, res) => {
    try {
        const userId = req.user._id;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid or missing User ID" });
        }

        const myProducts = await Listing.find({ seller: userId })
                                        .populate('category', 'name slug');
                                        
        res.status(200).json({ listings: myProducts });

    } catch (error) {
        console.error("Fetch My Listings Error Details:", error.message);
        res.status(500).json({ 
            message: "Server error while fetching listings",
            error: error.message 
        });
    }
};

// @desc    Update logged-in user profile
export const updateUserProfile = async (req, res) => {
    try {
        const updateData = {};
        const allowedFields = ['phone', 'hostel', 'roomNumber', 'branch', 'graduationYear', 'rollNumber'];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (req.file) { 
            if (req.user.profilePicture) {
                await deleteFromCloudinary(req.user.profilePicture); 
            }
            updateData.profilePicture = await uploadBufferToCloudinary(req.file.buffer);
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
            { returnDocument:'after', runValidators: true }
        ).select('-password');

        res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ message: "Server error during profile update" });
    }
};