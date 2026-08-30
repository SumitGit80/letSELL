import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
    // References
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },

    // Product Details
    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    images: [{
        type: String,
        required: true
    }],

    condition: {
        type: String,
        enum: ['New', 'Used - Like New', 'Used - Good', 'Used - Fair'],
        default: 'Used - Good'
    },

    status: {
        type: String,
        enum: ['Active', 'Sold', 'Inactive'],
        default: 'Active'
    }
}, { timestamps: true });


// Single-field indexes
listingSchema.index({ seller: 1 });
listingSchema.index({ category: 1 });

export default mongoose.model('Listing', listingSchema);