const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");

// Helper function to calculate average ratings
const calculateAverageRatings = async (listingId) => {
    const listing = await Listing.findById(listingId);
    if (!listing || !listing.reviews || listing.reviews.length === 0) {
        return {
            overall: 5.0,
            cleanliness: 5.0,
            communication: 5.0,
            checkIn: 5.0,
            accuracy: 5.0,
            location: 5.0,
            value: 5.0
        };
    }
    
    const reviews = await Review.find({ _id: { $in: listing.reviews } })
        .populate('author');
    
    if (reviews.length === 0) {
        return {
            overall: 5.0,
            cleanliness: 5.0,
            communication: 5.0,
            checkIn: 5.0,
            accuracy: 5.0,
            location: 5.0,
            value: 5.0
        };
    }
    
    const totals = {
        overall: 0,
        cleanliness: 0,
        communication: 0,
        checkIn: 0,
        accuracy: 0,
        location: 0,
        value: 0
    };
    
    reviews.forEach(review => {
        totals.overall += review.rating;
        if (review.categoryRatings) {
            totals.cleanliness += review.categoryRatings.cleanliness || review.rating;
            totals.communication += review.categoryRatings.communication || review.rating;
            totals.checkIn += review.categoryRatings.checkIn || review.rating;
            totals.accuracy += review.categoryRatings.accuracy || review.rating;
            totals.location += review.categoryRatings.location || review.rating;
            totals.value += review.categoryRatings.value || review.rating;
        } else {
            // Fallback for old reviews without category ratings
            totals.cleanliness += review.rating;
            totals.communication += review.rating;
            totals.checkIn += review.rating;
            totals.accuracy += review.rating;
            totals.location += review.rating;
            totals.value += review.rating;
        }
    });
    
    return {
        overall: (totals.overall / reviews.length).toFixed(1),
        cleanliness: (totals.cleanliness / reviews.length).toFixed(1),
        communication: (totals.communication / reviews.length).toFixed(1),
        checkIn: (totals.checkIn / reviews.length).toFixed(1),
        accuracy: (totals.accuracy / reviews.length).toFixed(1),
        location: (totals.location / reviews.length).toFixed(1),
        value: (totals.value / reviews.length).toFixed(1)
    };
};

module.exports.createreview = async (req, res) => {
    if (!req.user) {
        req.flash("error", "You must be logged in to create a review");
        return res.redirect("/login");
    }
    
    let { id } = req.params;
    let listing = await Listing.findById(id).populate('reviews');
    
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }
    
    // Check if user has already reviewed
    const existingReview = listing.reviews.find(r => r.author && r.author.toString() === req.user._id.toString());
    if (existingReview) {
        req.flash("error", "You have already reviewed this listing");
        return res.redirect(`/listings/${id}`);
    }
    
    // Check if user has a completed booking (for verified badge)
    const hasBooking = await Booking.findOne({
        listing: id,
        guest: req.user._id,
        status: { $in: ['confirmed', 'completed'] }
    });
    
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    
    // Set category ratings if provided, otherwise use overall rating
    if (req.body.review.categoryRatings) {
        newReview.categoryRatings = req.body.review.categoryRatings;
    } else {
        // Default all categories to overall rating
        const rating = newReview.rating;
        newReview.categoryRatings = {
            cleanliness: rating,
            communication: rating,
            checkIn: rating,
            accuracy: rating,
            location: rating,
            value: rating
        };
    }
    
    if (hasBooking) {
        newReview.isVerified = true;
    }
    
    listing.reviews.push(newReview);
    await newReview.save();
    
    // Recalculate ratings
    const newRatings = await calculateAverageRatings(id);
    listing.rating = newRatings;
    await listing.save();
    
    req.flash("success", "Thank you for your review!");
    res.redirect(`/listings/${id}#reviews`);
};

module.exports.updatereview = async (req, res) => {
    if (!req.user) {
        req.flash("error", "You must be logged in to edit a review");
        return res.redirect("/login");
    }
    
    let { id, reviewid } = req.params;
    let listing = await Listing.findById(id);
    let review = await Review.findById(reviewid);
    
    if (!listing || !review) {
        req.flash("error", "Review or listing not found");
        return res.redirect(`/listings/${id}`);
    }
    
    if (!review.author.equals(req.user._id)) {
        req.flash("error", "You can only edit your own reviews");
        return res.redirect(`/listings/${id}`);
    }
    
    review.comment = req.body.review.comment;
    review.rating = req.body.review.rating;
    if (req.body.review.categoryRatings) {
        review.categoryRatings = req.body.review.categoryRatings;
    }
    review.edited = true;
    review.editedAt = new Date();
    
    await review.save();
    
    // Recalculate ratings
    const newRatings = await calculateAverageRatings(id);
    listing.rating = newRatings;
    await listing.save();
    
    req.flash("success", "Review updated successfully");
    res.redirect(`/listings/${id}#reviews`);
};

module.exports.deletereview = async (req, res) => {
    if (!req.user) {
        req.flash("error", "You must be logged in to delete a review");
        return res.redirect("/login");
    }
    
    let { id, reviewid } = req.params;
    let listing = await Listing.findById(id);
    let review = await Review.findById(reviewid);
    
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }
    
    if (!review) {
        req.flash("error", "Review not found");
        return res.redirect(`/listings/${id}`);
    }
    
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewid } });
    await Review.findByIdAndDelete(reviewid);
    
    // Recalculate ratings
    const newRatings = await calculateAverageRatings(id);
    listing.rating = newRatings;
    await listing.save();
    
    req.flash("success", "Review deleted successfully");
    res.redirect(`/listings/${id}#reviews`);
};

module.exports.toggleHelpful = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: "You must be logged in" });
    }
    
    const { id, reviewid } = req.params;
    const review = await Review.findById(reviewid);
    
    if (!review) {
        return res.status(404).json({ error: "Review not found" });
    }
    
    const userId = req.user._id.toString();
    const helpfulIndex = review.helpfulUsers.findIndex(u => u.toString() === userId);
    
    if (helpfulIndex > -1) {
        // User already marked as helpful, remove it
        review.helpfulUsers.splice(helpfulIndex, 1);
        review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
        // Add user to helpful list
        review.helpfulUsers.push(req.user._id);
        review.helpfulCount += 1;
    }
    
    await review.save();
    
    res.json({
        helpfulCount: review.helpfulCount,
        isHelpful: helpfulIndex === -1
    });
};