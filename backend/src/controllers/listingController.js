import mongoose from 'mongoose';
import { z } from 'zod';
import Listing from '../models/Listing.js';
import Category from '../models/Category.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../services/imageService.js';

const LISTING_CONDITIONS = ['New', 'Used - Like New', 'Used - Good', 'Used - Fair'];

const createListingSchema = z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000),
    price: z.coerce.number().positive('Price must be a positive number'),
    category: z.string().refine(
        (id) => mongoose.Types.ObjectId.isValid(id),
        'Invalid category ID'
    ),
    condition: z.enum(LISTING_CONDITIONS).optional()
});

const updateListingSchema = z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100).optional(),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000).optional(),
    price: z.coerce.number().positive('Price must be a positive number').optional(),
    category: z.string().refine(
        (id) => mongoose.Types.ObjectId.isValid(id),
        'Invalid category ID'
    ).optional(),
    condition: z.enum(LISTING_CONDITIONS).optional()
});

const statusSchema = z.object({
    status: z.enum(['Active', 'Sold', 'Inactive'], { required_error: 'Status is required' })
});

const validationErrorResponse = (res, parsedData) =>
    res.status(400).json({
        message: 'Invalid input data',
        errors: parsedData.error.issues
    });

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * @desc    Create a new listing with images
 * @route   POST /api/listings/create
 */
export const createListing = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'At least one image is required.' });
        }
        const parsedData = createListingSchema.safeParse(req.body);
        if (!parsedData.success) {
            return validationErrorResponse(res, parsedData);
        }

        const { title, description, price, category, condition } = parsedData.data;

        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(400).json({ message: 'Category not found.' });
        }

        const imageUrls = await Promise.all(
            req.files.map((file) => uploadBufferToCloudinary(file.buffer))
        );

        const newListing = await Listing.create({
            seller: req.user._id,
            title,
            description,
            price,
            category,
            condition,
            images: imageUrls
        });

        const populatedListing = await Listing.findById(newListing._id)
            .populate('seller', 'name profilePicture')
            .populate('category', 'name slug icon');

        res.status(201).json({
            message: 'Listing created successfully',
            listing: populatedListing
        });
    } catch (error) {
        console.error('Listing Creation Error:', error);
        res.status(500).json({ message: 'Server error during creation' });
    }
};

/**
 * @desc    Get all active listings with optional category filter and pagination
 * @route   GET /api/listings
 */
export const getAllListings = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;

        const filter = { status: 'Active' };

        if (req.query.category) {
            if (!isValidObjectId(req.query.category)) {
                return res.status(400).json({ message: 'Invalid category ID format' });
            }
            filter.category = req.query.category;
        }

        const [listings, total] = await Promise.all([
            Listing.find(filter)
                .populate('seller', 'name profilePicture')
                .populate('category', 'name slug icon')
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
        console.error('Fetch Listings Error:', error);
        res.status(500).json({ message: 'Server error while fetching listings' });
    }
};

/**
 * @desc    Get a single listing by ID
 * @route   GET /api/listings/:id
 */
export const getListingById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid listing ID format' });
        }

        const listing = await Listing.findById(id)
            .populate('seller', 'name profilePicture email phone hostel')
            .populate('category', 'name slug icon');

        if (!listing || listing.status !== 'Active') {
            return res.status(404).json({ message: 'Listing not found.' });
        }

        res.status(200).json({ listing });
    } catch (error) {
        console.error('Fetch Listing Error:', error);
        res.status(500).json({ message: 'Server error while fetching listing' });
    }
};

/**
 * @desc    Hard-delete a listing
 * @route   DELETE /api/listings/:id
 */
export const deleteListing = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid listing ID format' });
        }

        const listing = await Listing.findById(id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found.' });
        }

        // Allow owner OR admin to delete (assuming admin role exists on req.user)
        if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized to delete this listing.' });
        }

        // Delete images from Cloudinary
        if (listing.images && listing.images.length > 0) {
            await Promise.all(
                listing.images.map(imgUrl => deleteFromCloudinary(imgUrl))
            );
        }

        // Hard delete from database
        await Listing.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Listing permanently deleted.',
            id
        });
    } catch (error) {
        console.error('Listing deletion error:', error);
        res.status(500).json({ message: 'Server error during listing deletion.' });
    }
};

/**
 * @desc    Search active listings by title and/or category using MongoDB Atlas Search
 * @route   GET /api/listings/search?q=laptop&category=<id>
 */
export const searchListings = async (req, res) => {
    try {
        const searchQuery = req.query.q?.trim();
        const categoryId = req.query.category;
        if (!searchQuery && !categoryId) {
            return res.status(200).json({ listings: [] });
        }

        let pipeline = [];

      
        if (searchQuery) {
            pipeline.push({
                $search: {
                    index: "default", 
                    text: {
                        query: searchQuery,
                        path: ["title", "description"], 
                        fuzzy: {
                            maxEdits: 2, 
                            prefixLength: 1 
                        }
                    }
                }
            });
        }

      
        let matchFilter = { status: 'Active' }; 

        if (categoryId) {
            if (!isValidObjectId(categoryId)) {
                return res.status(400).json({ message: 'Invalid category ID format' });
            }
           
            matchFilter.category = new mongoose.Types.ObjectId(categoryId);
        }

        pipeline.push({ $match: matchFilter });

        
        if (!searchQuery) {
            pipeline.push({ $sort: { createdAt: -1 } });
        }

        pipeline.push({ $limit: 10 });

        const searchResults = await Listing.aggregate(pipeline);

        const populatedListings = await Listing.populate(searchResults, [
            { path: 'seller', select: 'name profilePicture' },
            { path: 'category', select: 'name slug icon' }
        ]);

        res.status(200).json({ listings: populatedListings });

    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ message: 'Server error during searching' });
    }
};

/**
 * @desc    Update a listing's details and/or modify images
 * @route   PUT /api/listings/:id
 */
export const updateListing = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid listing ID format' });
        }

        const listing = await Listing.findById(id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found.' });
        }

        if (listing.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to modify this listing.' });
        }

        const parsedData = updateListingSchema.safeParse(req.body);
        if (!parsedData.success) {
            return validationErrorResponse(res, parsedData);
        }

        const updateData = { ...parsedData.data };

        if (updateData.category) {
            const categoryExists = await Category.findById(updateData.category);
            if (!categoryExists) {
                return res.status(400).json({ message: 'Category not found.' });
            }
        }

        // Handle image retention and deletion
        let finalImages = [...listing.images];

        if (req.body.retainedImages !== undefined) {
            // retainedImages will be sent as a JSON string from frontend FormData
            const retainedImages = typeof req.body.retainedImages === 'string' 
                ? JSON.parse(req.body.retainedImages) 
                : req.body.retainedImages;
            
            // Find which images were removed
            const removedImages = listing.images.filter(img => !retainedImages.includes(img));
            
            // Delete removed images from Cloudinary
            if (removedImages.length > 0) {
                await Promise.all(
                    removedImages.map(imgUrl => deleteFromCloudinary(imgUrl))
                );
            }
            finalImages = retainedImages;
        }

        // Append new images if uploaded
        if (req.files && req.files.length > 0) {
            const newImageUrls = await Promise.all(
                req.files.map((file) => uploadBufferToCloudinary(file.buffer))
            );
            finalImages = [...finalImages, ...newImageUrls];
        }

        // Enforce max 5 images total
        if (finalImages.length > 5) {
            return res.status(400).json({ message: 'A listing can have a maximum of 5 images.' });
        }

        updateData.images = finalImages;

        const updatedListing = await Listing.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        )
            .populate('seller', 'name profilePicture')
            .populate('category', 'name slug icon');

        res.status(200).json({
            message: 'Listing updated successfully.',
            listing: updatedListing
        });
    } catch (error) {
        console.error('Listing Update Error:', error);
        res.status(500).json({ message: 'Server error during listing update.' });
    }
};

/**
 * @desc    Update listing status (Active / Sold / Inactive)
 * @route   PATCH /api/listings/:id/status
 */
export const updateListingStatus = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid listing ID format' });
        }

        const parsedData = statusSchema.safeParse(req.body);
        if (!parsedData.success) {
            return validationErrorResponse(res, parsedData);
        }

        const listing = await Listing.findById(id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found.' });
        }

        if (listing.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to modify this listing.' });
        }

        listing.status = parsedData.data.status;
        await listing.save();

        res.status(200).json({
            message: `Listing status updated to '${listing.status}'.`,
            listing
        });
    } catch (error) {
        console.error('Listing Status Update Error:', error);
        res.status(500).json({ message: 'Server error during status update.' });
    }
};