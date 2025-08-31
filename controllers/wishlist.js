const Wishlist = require("../models/wishlist.js");
const Listing = require("../models/listing.js");

// Get user's wishlist
module.exports.getWishlist = async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({ user: req.user._id })
            .populate("listings");

        if (!wishlist) {
            wishlist = new Wishlist({ user: req.user._id, listings: [] });
            await wishlist.save();
        }

        res.render("wishlist/index.ejs", { wishlist });
    } catch (error) {
        req.flash("error", "Failed to load wishlist");
        res.redirect("/listings");
    }
};

// Add to wishlist
module.exports.addToWishlist = async (req, res) => {
    try {
        const { listingId } = req.params;
        
        const listing = await Listing.findById(listingId);
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }

        let wishlist = await Wishlist.findOne({ user: req.user._id });
        
        if (!wishlist) {
            wishlist = new Wishlist({ 
                user: req.user._id, 
                listings: [listingId] 
            });
        } else {
            // Check if listing is already in wishlist
            if (wishlist.listings.includes(listingId)) {
                req.flash("error", "Listing already in wishlist");
                return res.redirect(`/listings/${listingId}`);
            }
            wishlist.listings.push(listingId);
        }

        await wishlist.save();
        req.flash("success", "Added to wishlist!");
        
        // Return JSON for AJAX requests
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ success: true, message: "Added to wishlist!" });
        }
        
        res.redirect(`/listings/${listingId}`);
    } catch (error) {
        console.error(error);
        req.flash("error", "Failed to add to wishlist");
        res.redirect("/listings");
    }
};

// Remove from wishlist
module.exports.removeFromWishlist = async (req, res) => {
    try {
        const { listingId } = req.params;
        
        const wishlist = await Wishlist.findOne({ user: req.user._id });
        
        if (!wishlist) {
            req.flash("error", "Wishlist not found");
            return res.redirect("/wishlist");
        }

        wishlist.listings = wishlist.listings.filter(
            id => id.toString() !== listingId
        );
        
        await wishlist.save();
        req.flash("success", "Removed from wishlist");
        
        // Return JSON for AJAX requests
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ success: true, message: "Removed from wishlist" });
        }
        
        res.redirect("/wishlist");
    } catch (error) {
        console.error(error);
        req.flash("error", "Failed to remove from wishlist");
        res.redirect("/wishlist");
    }
};

// Check if listing is in user's wishlist (for AJAX)
module.exports.checkWishlistStatus = async (req, res) => {
    try {
        const { listingId } = req.params;
        
        const wishlist = await Wishlist.findOne({ user: req.user._id });
        
        const isInWishlist = wishlist && wishlist.listings.some(id => id.toString() === listingId);
        
        res.json({ isInWishlist });
    } catch (error) {
        res.status(500).json({ error: "Failed to check wishlist status" });
    }
};

// Toggle wishlist status (for AJAX)
module.exports.toggleWishlist = async (req, res) => {
    try {
        const { listingId } = req.body;
        
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }

        let wishlist = await Wishlist.findOne({ user: req.user._id });
        
        let added = false;
        
        if (!wishlist) {
            wishlist = new Wishlist({ 
                user: req.user._id, 
                listings: [listingId] 
            });
            added = true;
        } else {
            // Check if listing is already in wishlist
            const isInWishlist = wishlist.listings.some(id => id.toString() === listingId.toString());
            
            if (isInWishlist) {
                // Remove from wishlist
                wishlist.listings = wishlist.listings.filter(id => id.toString() !== listingId.toString());
            } else {
                // Add to wishlist
                wishlist.listings.push(listingId);
                added = true;
            }
        }

        await wishlist.save();
        
        return res.json({ 
            success: true, 
            added: added,
            message: added ? "Added to wishlist!" : "Removed from wishlist" 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Failed to update wishlist" });
    }
};