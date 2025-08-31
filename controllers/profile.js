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
        if (req.file) {
            updateData['profile.profilePicture'] = {
                url: req.file.path,
                filename: req.file.filename
            };
        }

        await User.findByIdAndUpdate(req.params.id, updateData);

        req.flash("success", "Profile updated successfully!");
        res.redirect(`/profile/${req.params.id}`);
    } catch (error) {
        console.error("Update profile error:", error);
        req.flash("error", "Failed to update profile");
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