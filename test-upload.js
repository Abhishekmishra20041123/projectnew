// Simple test to verify file upload configuration
const multer = require('multer');
const { storage } = require('./cloudConfig.js');

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 11 // max 11 files total (1 main + 10 additional)
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Test upload configuration with correct field names
const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
]);

console.log('Multer configuration test:');
console.log('- Main image field: "image" (max 1 file)');
console.log('- Additional images field: "additionalImages" (max 10 files)');
console.log('Configuration is ready for testing.');