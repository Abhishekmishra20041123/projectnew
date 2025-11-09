const User = require("../models/user.js");
const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const Wishlist = require("../models/wishlist.js");

// Show user profile
module.exports.showProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/listings");
        }

        // Get user's listings if they are a host
        let listings = [];
        if (user.host.isHost) {
            listings = await Listing.find({ owner: id }).limit(6);
        }

        // Get user's reviews count
        const bookings = await Booking.find({ 
            $or: [{ guest: id }, { host: id }],
            status: 'completed'
        });

        res.render("users/profile.ejs", { 
            profileUser: user, 
            listings,
            reviewsCount: bookings.length,
            isOwnProfile: req.user && req.user._id.toString() === id
        });
    } catch (error) {
        req.flash("error", "Something went wrong");
        res.redirect("/listings");
    }
};

// Show edit profile form
module.exports.showEditProfile = async (req, res) => {
    try {
        if (!req.user) {
            req.flash("error", "You must be logged in");
            return res.redirect("/login");
        }
        
        // Use mongoose's equals method for ObjectId comparison
        if (!req.user._id.equals(req.params.id)) {
            req.flash("error", "You can only edit your own profile");
            return res.redirect(`/profile/${req.user._id}`);
        }

        res.render("users/edit_profile.ejs", { user: req.user });
    } catch (error) {
        console.error("Edit profile error:", error);
        req.flash("error", "Something went wrong");
        res.redirect("/listings");
    }
};

// Update profile
module.exports.updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            req.flash("error", "You must be logged in");
            return res.redirect("/login");
        }
        
        // Use mongoose's equals method for ObjectId comparison
        if (!req.user._id.equals(req.params.id)) {
            req.flash("error", "You can only edit your own profile");
            return res.redirect(`/profile/${req.user._id}`);
        }

        const {
            firstName, lastName, bio, phone, 
            street, city, state, country, zipCode,
            languages, isHost
        } = req.body;

        const updateData = {
            'profile.firstName': firstName || '',
            'profile.lastName': lastName || '',
            'profile.bio': bio || '',
            'profile.phone': phone || '',
            'profile.address.street': street || '',
            'profile.address.city': city || '',
            'profile.address.state': state || '',
            'profile.address.country': country || '',
            'profile.address.zipCode': zipCode || '',
            'profile.languages': languages ? languages.split(',').map(l => l.trim()) : [],
            'host.isHost': isHost === 'on'
        };

        // If becoming a host for first time, set host since date
        if (isHost === 'on' && !req.user.host.isHost) {
            updateData['host.hostSince'] = new Date();
        }

        // Handle profile picture upload if file exists
        if (req.files && req.files.profilePicture && req.files.profilePicture[0]) {
            updateData['profile.profilePicture'] = {
                url: req.files.profilePicture[0].path,
                filename: req.files.profilePicture[0].filename
            };
        }

        // Handle identity document upload if file exists
        if (req.files && req.files.identityDocument && req.files.identityDocument[0]) {
            try {
                const identityDoc = req.files.identityDocument[0];
                
                // Validate file was uploaded successfully
                if (!identityDoc.path) {
                    throw new Error('Identity document upload failed. Please try again.');
                }
                
                updateData['profile.identityDocument'] = {
                    url: identityDoc.path,
                    filename: identityDoc.filename
                };
                
                // Reset verification status when new document is uploaded
                updateData['profile.verified.identity'] = false;
                
                console.log('Identity document uploaded successfully:', identityDoc.filename);
            } catch (uploadError) {
                console.error("Identity document upload error:", uploadError);
                req.flash("error", uploadError.message || "Failed to upload identity document. Please ensure the file is a valid image (JPG, PNG) or PDF and is under 5MB.");
                return res.redirect(`/profile/${req.params.id}/edit`);
            }
        }

        await User.findByIdAndUpdate(req.params.id, updateData);

        req.flash("success", "Profile updated successfully!");
        res.redirect(`/profile/${req.params.id}`);
    } catch (error) {
        console.error("Update profile error:", error);
        
        // Provide more specific error messages
        let errorMessage = "Failed to update profile";
        if (error.message) {
            errorMessage = error.message;
        } else if (error.name === 'ValidationError') {
            errorMessage = "Validation error. Please check your input.";
        } else if (error.name === 'CastError') {
            errorMessage = "Invalid data format.";
        }
        
        req.flash("error", errorMessage);
        res.redirect(`/profile/${req.params.id}/edit`);
    }
};

// Show dashboard
module.exports.showDashboard = async (req, res) => {
    try {
        const { type } = req.params; // 'host' or 'guest'
        const userId = req.user._id;

        if (type === 'host') {
            // Host dashboard
            const listings = await Listing.find({ owner: userId });
            
            // Find bookings for listings owned by this user
            const bookings = await Booking.find({ 
                listing: { $in: listings.map(l => l._id) }
            })
                .populate("listing", "title image owner")
                .populate("guest", "username profile")
                .populate("host", "username profile")
                .sort({ createdAt: -1 })
                .limit(10);

            const stats = {
                totalListings: listings.length,
                totalBookings: bookings.length,
                pendingBookings: bookings.filter(b => b.status === 'pending').length,
                confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
                totalRevenue: bookings.filter(b => b.paymentStatus === 'paid')
                    .reduce((sum, b) => sum + (b.total || 0), 0)
            };

            res.render("dashboard/host.ejs", { listings, bookings, stats });
        } else {
            // Guest dashboard
            const bookings = await Booking.find({ guest: userId })
                .populate("listing", "title image location price")
                .populate("host", "username profile")
                .sort({ createdAt: -1 })
                .limit(10);

            const wishlist = await Wishlist.findOne({ user: userId })
                .populate("listings", "title image price location");

            const stats = {
                totalBookings: bookings.length,
                upcomingBookings: bookings.filter(b => 
                    b.status === 'confirmed' && new Date(b.checkIn) > new Date()).length,
                completedBookings: bookings.filter(b => b.status === 'completed').length,
                wishlistItems: wishlist ? wishlist.listings.length : 0
            };

            res.render("dashboard/guest.ejs", { 
                bookings, 
                wishlist: wishlist ? wishlist.listings : [], 
                stats 
            });
        }
    } catch (error) {
        console.error(error);
        req.flash("error", "Failed to load dashboard");
        res.redirect("/listings");
    }
};

// View identity document securely (for profile owner)
module.exports.viewIdentityDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/listings");
        }

        // Check if document exists and has a valid URL
        if (!user.profile.identityDocument || !user.profile.identityDocument.url) {
            req.flash("error", "Identity document not found or not uploaded yet");
            return res.redirect(`/profile/${id}`);
        }

        // Check if user is admin or the document owner
        const isAdmin = req.user && req.user.isAdmin;
        const isOwner = req.user && req.user._id.toString() === id;

        if (!isAdmin && !isOwner) {
            req.flash("error", "You don't have permission to view this document");
            return res.redirect(`/profile/${id}`);
        }

        // Validate URL before redirecting
        if (!user.profile.identityDocument.url || user.profile.identityDocument.url === 'undefined') {
            req.flash("error", "Identity document URL is invalid. Please upload a new document.");
            return res.redirect(`/profile/${id}/edit`);
        }

        // Redirect to the document URL
        res.redirect(user.profile.identityDocument.url);
    } catch (error) {
        console.error("View document error:", error);
        req.flash("error", "Failed to view document");
        res.redirect("/listings");
    }
};