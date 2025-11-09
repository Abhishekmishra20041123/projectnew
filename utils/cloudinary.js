const { cloudinary } = require("../cloudConfig.js");

/**
 * Delete images from Cloudinary
 * @param {string[]} filenames - Array of filenames to delete
 * @returns {Promise<Object>} - Result of deletion operations
 */
async function deleteImagesFromCloudinary(filenames) {
    const results = {
        success: [],
        failed: []
    };
    
    if (!filenames || filenames.length === 0) {
        return results;
    }
    
    console.log('Deleting images from Cloudinary:', filenames);
    
    for (const filename of filenames) {
        try {
            if (filename) {
                const result = await cloudinary.uploader.destroy(filename);
                console.log(`Successfully deleted image ${filename} from Cloudinary:`, result);
                results.success.push({ filename, result });
            }
        } catch (error) {
            console.error(`Error deleting image ${filename} from Cloudinary:`, error);
            results.failed.push({ filename, error: error.message });
        }
    }
    
    return results;
}

/**
 * Delete a single image from Cloudinary
 * @param {string} filename - Filename to delete
 * @returns {Promise<Object>} - Result of deletion operation
 */
async function deleteImageFromCloudinary(filename) {
    return await deleteImagesFromCloudinary([filename]);
}

module.exports = {
    deleteImagesFromCloudinary,
    deleteImageFromCloudinary
};