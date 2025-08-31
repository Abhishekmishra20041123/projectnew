const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const {isloggedin,isOwner,validateListing} = require("../middlewear.js");
const listingController = require("../controllers/listing.js");
const multer = require("multer");
const {storage} = require("../cloudConfig.js");
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

// Multer error handling middleware
const handleMulterError = (error, req, res, next) => {
    console.log('Multer error caught:', error);
    if (error instanceof multer.MulterError) {
        console.log('Multer error code:', error.code);
        if (error.code === 'LIMIT_FILE_SIZE') {
            req.flash('error', 'File too large. Please upload images smaller than 5MB.');
        } else if (error.code === 'LIMIT_FILE_COUNT') {
            req.flash('error', 'Too many files. Maximum 11 files allowed.');
        } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            req.flash('error', 'Unexpected file field detected.');
        } else {
            req.flash('error', `Upload error: ${error.message}`);
        }
        return res.redirect('/listings'); // Redirect to listings page instead of 'back'
    } else if (error && error.message === 'Only image files are allowed!') {
        req.flash('error', 'Only image files (jpg, jpeg, png, gif, webp) are allowed.');
        return res.redirect('/listings'); // Redirect to listings page instead of 'back'
    }
    next(error);
};

// Upload middleware with specific field configuration
// Fix: Use simplified field names without square brackets to match EJS templates
const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
]);

// Middleware to handle upload errors
const handleUpload = (req, res, next) => {
    uploadFields(req, res, (err) => {
        if (err) {
            console.log('Upload error in middleware:', err);
            return handleMulterError(err, req, res, next);
        }
        
        // Log received files for debugging
        console.log('Files received in middleware:', req.files ? Object.keys(req.files).length : 0);
        if (req.files) {
            Object.keys(req.files).forEach((fieldname, index) => {
                req.files[fieldname].forEach((file, fileIndex) => {
                    console.log(`File ${index + 1}-${fileIndex + 1}: ${file.fieldname} = ${file.originalname}`);
                });
            });
        }
        
        next();
    });
};

// Routes
router.route("/")
.get(wrapAsync(listingController.index))
    .post(isloggedin, handleUpload, validateListing, wrapAsync(listingController.createlisting));

router.get("/new", isloggedin, listingController.rendernewform);

router.get("/search", async (req, res) => {
    let query = req.query.q;
    if (!query) {
        return res.redirect("/listings");
    }

    const listings = await Listing.find({
        $or: [
            { country: { $regex: query, $options: "i" } },
            { location: { $regex: query, $options: "i" } },
            { title: { $regex: query, $options: "i" } }
        ]
    });

    res.render("listings/index.ejs", { allist: listings });
});

router.route("/:id")
    .get(wrapAsync(listingController.showlisting))
    .put(isloggedin, isOwner, handleUpload, validateListing, wrapAsync(listingController.updatelisting))
    .delete(isloggedin, isOwner, wrapAsync(listingController.deletelisting));

router.get("/:id/edit", isloggedin, isOwner, wrapAsync(listingController.rendoreditform));

// Delete additional image
router.delete("/:id/images/:imageIndex", isloggedin, isOwner, wrapAsync(listingController.deleteAdditionalImage));

module.exports = router;