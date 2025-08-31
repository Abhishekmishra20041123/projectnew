const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isloggedin } = require("../middlewear.js");
const profileController = require("../controllers/profile.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// Show user profile
router.get("/:id", wrapAsync(profileController.showProfile));

// Show edit profile form
router.get("/:id/edit", isloggedin, wrapAsync(profileController.showEditProfile));

// Update profile
router.put("/:id", isloggedin, upload.single('profilePicture'), wrapAsync(profileController.updateProfile));

// Dashboard
router.get("/dashboard/:type", isloggedin, wrapAsync(profileController.showDashboard));

module.exports = router;