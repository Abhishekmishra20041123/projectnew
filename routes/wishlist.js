const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isloggedin } = require("../middlewear.js");
const wishlistController = require("../controllers/wishlist.js");

// Get wishlist
router.get("/", isloggedin, wrapAsync(wishlistController.getWishlist));

// Add to wishlist
router.post("/add/:listingId", isloggedin, wrapAsync(wishlistController.addToWishlist));

// Remove from wishlist
router.delete("/remove/:listingId", isloggedin, wrapAsync(wishlistController.removeFromWishlist));

// Check wishlist status
router.get("/check/:listingId", isloggedin, wrapAsync(wishlistController.checkWishlistStatus));

// Toggle wishlist status (for AJAX)
router.post("/toggle", isloggedin, wrapAsync(wishlistController.toggleWishlist));

module.exports = router;