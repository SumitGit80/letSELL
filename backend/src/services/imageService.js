import cloudinary from '../config/cloudinary.js';

// Uploads a memory buffer to Cloudinary
export const uploadBufferToCloudinary = (buffer) => {
    console.log("image uploading initiated");
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'olx_clone_listings',
                format: 'webp',
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        
        // Write buffer to stream
        uploadStream.end(buffer); 
    });
};


export const deleteFromCloudinary = async (cloudinaryUrl) => {
    try {
        // Extract public ID from Cloudinary URL
        const publicId = cloudinaryUrl
            .split('?')[0]                           
            .split('/upload/')[1]                    
            ?.replace(/^v\d+\//, '')                 
            ?.replace(/\.[^.]+$/, '');               
        
        if (!publicId) {
            console.error("Invalid Cloudinary URL");
            return false;
        }
        
        const result = await cloudinary.uploader.destroy(publicId);
        
        if (result.result === 'ok') {
            console.log(`✅ Image deleted: ${publicId}`);
            return true;
        } else {
            console.log(`❌ Delete failed: ${result.result}`);
            return false;
        }
    } catch (error) {
        console.error("Cloudinary Delete Error:", error);
        return false;
    }
};