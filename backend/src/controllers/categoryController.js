import Category from '../models/Category.js'; 

export const getAllCategories = async (req, res) => {
    try {
        
        const categories = await Category.find({}).lean();

        
        if (!categories || categories.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "No categories found in the database" 
            });
        }

        res.status(200).json({ 
            success: true, 
            count: categories.length,
            categories 
        });

    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error while fetching categories" 
        });
    }
};