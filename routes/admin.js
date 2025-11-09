const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isloggedin, isAdmin } = require("../middlewear.js");
const adminController = require("../controllers/admin.js");

// All admin routes require authentication and admin privileges
router.use(isloggedin);
router.use(isAdmin);

// Admin dashboard
router.get("/dashboard", wrapAsync(adminController.showAdminDashboard));

// View user verification details
router.get("/verification/:userId", wrapAsync(adminController.showUserVerification));

// Approve identity verification
router.post("/verification/:userId/approve", wrapAsync(adminController.approveVerification));

// Reject identity verification
router.post("/verification/:userId/reject", wrapAsync(adminController.rejectVerification));

// View identity document (secured)
router.get("/document/:userId", wrapAsync(adminController.viewIdentityDocument));

module.exports = router;



