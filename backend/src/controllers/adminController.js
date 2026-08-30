// src/controllers/adminController.js
import { z } from 'zod';
import User from '../models/User.js';
import Listing from '../models/Listing.js';

const adminStatusFilterSchema = z.object({
    status: z.enum(['Active', 'Sold', 'Inactive']).optional()
});

/**
 * @desc    Get all users with pagination
 * @route   GET /api/admin/users
 */
export const getAllUsers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find({}).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
            User.countDocuments()
        ]);

        res.status(200).json({
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Admin Get Users Error:', error);
        res.status(500).json({ message: 'Server error while fetching users.' });
    }
};

/**
 * @desc    Hard-delete a user by ID
 * @route   DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (id === req.user._id.toString()) {
            return res.status(400).json({ message: 'Admins cannot delete their own account.' });
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ message: `User '${user.email}' has been deleted.` });
    } catch (error) {
        console.error('Admin Delete User Error:', error);
        res.status(500).json({ message: 'Server error while deleting user.' });
    }
};

/**
 * @desc    Get all listings regardless of status, with optional status filter and pagination
 * @route   GET /api/admin/listings
 */
export const getAllListingsAdmin = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;

        const parsedFilter = adminStatusFilterSchema.safeParse(req.query);
        if (!parsedFilter.success) {
            return res.status(400).json({ message: 'Invalid status filter value.' });
        }

        const filter = {};
        if (parsedFilter.data.status) {
            filter.status = parsedFilter.data.status;
        }

        const [listings, total] = await Promise.all([
            Listing.find(filter)
                .populate('seller', 'name email')
                .populate('category', 'name slug')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Listing.countDocuments(filter)
        ]);

        res.status(200).json({
            listings,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Admin Get Listings Error:', error);
        res.status(500).json({ message: 'Server error while fetching listings.' });
    }
};
