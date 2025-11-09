const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isloggedin } = require("../middlewear.js");
const profileController = require("../controllers/profile.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
// Configure multer with proper error handling
// Validate Cloudinary configuration
if (!storage) {
    console.error('ERROR: Cloudinary storage is not configured properly!');
}

const upload = multer({ 
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
    },
    fileFilter: (req, file, cb) => {
        console.log(`File filter check: fieldname=${file.fieldname}, originalname=${file.originalname}, mimetype=${file.mimetype}`);
        
        // Validate file fields that we expect
        if (file.fieldname === 'identityDocument') {
            // Check both extension and mimetype for better validation
            const isValidExtension = /\.(jpg|jpeg|png|pdf)$/i.test(file.originalname);
            const isValidMimeType = /^(image\/(jpeg|jpg|png)|application\/pdf)$/i.test(file.mimetype);
            
            if (!isValidExtension && !isValidMimeType) {
                console.error(`Identity document validation failed: extension=${file.originalname.match(/\.[^.]+$/)?.[0]}, mimetype=${file.mimetype}`);
                return cb(new Error('Identity document must be an image (JPG, PNG) or PDF file!'), false);
            }
            cb(null, true);
        } else if (file.fieldname === 'profilePicture') {
            const isValidExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname);
            const isValidMimeType = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype);
            
            if (!isValidExtension && !isValidMimeType) {
                console.error(`Profile picture validation failed: extension=${file.originalname.match(/\.[^.]+$/)?.[0]}, mimetype=${file.mimetype}`);
                return cb(new Error('Profile picture must be an image file (JPG, PNG, GIF, or WebP)!'), false);
            }
            cb(null, true);
        } else {
            // Accept other file fields (we'll filter them out in the middleware)
            // This prevents "Unexpected field" errors
            console.log(`Accepting unexpected file field: ${file.fieldname} (will be filtered later)`);
            cb(null, true);
        }
    }
});

// Dashboard - must come before /:id routes to avoid conflicts
router.get("/dashboard/:type", isloggedin, wrapAsync(profileController.showDashboard));

// Multer error handling middleware
const handleMulterError = (error, req, res, next) => {
    if (!error) {
        return next();
    }
    
    console.error('=== MULTER ERROR HANDLER ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error field:', error.field);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            req.flash('error', 'File too large. Please upload files smaller than 5MB.');
            return res.redirect(`/profile/${req.params.id}/edit`);
        } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            // This happens when a file field is sent that we didn't expect
            // This can happen if browser sends empty file inputs
            console.log('Unexpected file field detected:', error.field);
            // For profile updates, we'll ignore this and continue
            // The file fields are optional anyway
            return next();
        } else if (error.code === 'LIMIT_FILE_COUNT') {
            req.flash('error', 'Too many files uploaded.');
            return res.redirect(`/profile/${req.params.id}/edit`);
        } else {
            console.error('Other multer error:', error);
            req.flash('error', `Upload error: ${error.message || 'An unexpected upload error occurred. Please try again.'}`);
            return res.redirect(`/profile/${req.params.id}/edit`);
        }
    } else if (error.message) {
        // Handle file filter errors and other errors
        console.error('File upload error:', error.message);
        
        // Provide user-friendly error messages
        let userMessage = error.message;
        if (error.message.includes('Identity document must be')) {
            userMessage = 'Identity document must be an image (JPG, PNG) or PDF file.';
        } else if (error.message.includes('Profile picture must be')) {
            userMessage = 'Profile picture must be an image file (JPG, PNG, GIF, or WebP).';
        } else if (error.message.includes('Only image files')) {
            userMessage = 'Only image files are allowed.';
        }
        
        req.flash('error', userMessage || 'File upload error occurred. Please check the file format and size.');
        return res.redirect(`/profile/${req.params.id}/edit`);
    }
    
    next(error);
};

// View identity document (secured - owner or admin only) - must come before /:id
router.get("/:id/document", isloggedin, wrapAsync(profileController.viewIdentityDocument));

// Show edit profile form - must come before /:id
router.get("/:id/edit", isloggedin, wrapAsync(profileController.showEditProfile));

// Update profile - handle both profilePicture and identityDocument
// Use .any() to accept any file fields, then filter in controller
// This avoids "Unexpected field" errors
const uploadMiddleware = (req, res, next) => {
    // Use .any() to accept all file fields, then we'll filter them in the controller
    // This prevents "Unexpected field" errors
    upload.any()(req, res, (err) => {
        if (err) {
            console.error('=== UPLOAD MIDDLEWARE ERROR ===');
            console.error('Error details:', {
                name: err.name,
                message: err.message,
                code: err.code,
                field: err.field,
                stack: err.stack
            });
            
            // Handle multer errors
            return handleMulterError(err, req, res, next);
        }
        
        // Filter files to only include the ones we expect and organize them
        if (req.files && Array.isArray(req.files)) {
            const allowedFields = ['profilePicture', 'identityDocument'];
            const filteredFiles = req.files.filter(file => {
                const isAllowed = allowedFields.includes(file.fieldname);
                if (!isAllowed) {
                    console.log(`Filtered out unexpected file field: ${file.fieldname}`);
                }
                return isAllowed;
            });
            
            // Organize files by fieldname (similar to .fields() behavior)
            // This format matches what the controller expects: req.files.profilePicture[0]
            const organizedFiles = {};
            filteredFiles.forEach(file => {
                if (!organizedFiles[file.fieldname]) {
                    organizedFiles[file.fieldname] = [];
                }
                organizedFiles[file.fieldname].push(file);
                console.log(`File organized: ${file.fieldname} = ${file.originalname} (${file.size} bytes)`);
            });
            req.files = organizedFiles;
            
            console.log('Files processed:', Object.keys(req.files).length > 0 ? Object.keys(req.files) : 'none');
        } else {
            // Ensure req.files is an object even if no files
            req.files = {};
            console.log('No files in request');
        }
        
        next();
    });
};

router.put("/:id", isloggedin, uploadMiddleware, wrapAsync(profileController.updateProfile));

// Show user profile - must be last to avoid conflicts
router.get("/:id", wrapAsync(profileController.showProfile));

module.exports = router;