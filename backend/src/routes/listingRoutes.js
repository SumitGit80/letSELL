import express from 'express';
import multer from 'multer';
import upload from '../middleware/upload.js';
import {
    createListing,
    getAllListings,
    getListingById,
    deleteListing,
    searchListings,
    updateListing,
    updateListingStatus
} from '../controllers/listingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const handleUpload = (req, res, next) => {
    const uploadImages = upload.array('images', 5);

    uploadImages(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    message: 'File too large. Maximum allowed size is 5MB per image.'
                });
            }
            return res.status(400).json({ message: err.message });
        }

        if (err) {
            return res.status(400).json({ message: err.message });
        }

        next();
    });
};

router.get('/search', searchListings);
router.post('/create', protect, handleUpload, createListing);
router.get('/', getAllListings);
router.get('/:id', getListingById);
router.put('/:id', protect, handleUpload, updateListing);
router.patch('/:id/status', protect, updateListingStatus);
router.delete('/:id', protect, deleteListing);

export default router;
