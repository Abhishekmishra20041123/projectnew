const User = require("../models/user.js");

// Show admin dashboard with pending identity verifications
module.exports.showAdminDashboard = async (req, res) => {
    try {
        // Get all users with identity documents that are not verified
        // Only include users with valid document URLs
        const pendingVerifications = await User.find({
            'profile.identityDocument': { $exists: true, $ne: null },
            'profile.identityDocument.url': { $exists: true, $ne: null, $ne: '' },
            'profile.verified.identity': false
        }).select('username email profile createdAt');

        // Get all users with verified identity
        const verifiedUsers = await User.find({
            'profile.verified.identity': true
        }).select('username email profile createdAt');

        // Get statistics
        const stats = {
            totalUsers: await User.countDocuments(),
            pendingVerifications: pendingVerifications.length,
            verifiedUsers: verifiedUsers.length,
            totalHosts: await User.countDocuments({ 'host.isHost': true })
        };

        res.render("admin/dashboard.ejs", {
            pendingVerifications,
            verifiedUsers,
            stats
        });
    } catch (error) {
        console.error("Admin dashboard error:", error);
        req.flash("error", "Failed to load admin dashboard");
        res.redirect("/listings");
    }
};

// Show user details for verification
module.exports.showUserVerification = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/admin/dashboard");
        }

        if (!user.profile.identityDocument) {
            req.flash("error", "User has not uploaded an identity document");
            return res.redirect("/admin/dashboard");
        }

        res.render("admin/verification.ejs", { user });
    } catch (error) {
        console.error("Show verification error:", error);
        req.flash("error", "Failed to load verification details");
        res.redirect("/admin/dashboard");
    }
};

// Approve identity verification
module.exports.approveVerification = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/admin/dashboard");
        }

        if (!user.profile.identityDocument) {
            req.flash("error", "User has not uploaded an identity document");
            return res.redirect("/admin/dashboard");
        }

        // Verify the identity
        await User.findByIdAndUpdate(userId, {
            'profile.verified.identity': true
        });

        req.flash("success", `Identity verified for user: ${user.username}`);
        res.redirect("/admin/dashboard");
    } catch (error) {
        console.error("Approve verification error:", error);
        req.flash("error", "Failed to approve verification");
        res.redirect("/admin/dashboard");
    }
};

// Reject identity verification
module.exports.rejectVerification = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/admin/dashboard");
        }

        // Remove identity document and reset verification
        await User.findByIdAndUpdate(userId, {
            'profile.identityDocument': null,
            'profile.verified.identity': false
        });

        req.flash("success", `Identity verification rejected for user: ${user.username}${reason ? '. Reason: ' + reason : ''}`);
        res.redirect("/admin/dashboard");
    } catch (error) {
        console.error("Reject verification error:", error);
        req.flash("error", "Failed to reject verification");
        res.redirect("/admin/dashboard");
    }
};

// View identity document securely
module.exports.viewIdentityDocument = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/listings");
        }

        // Check if document exists and has a valid URL
        if (!user.profile.identityDocument || !user.profile.identityDocument.url) {
            req.flash("error", "Identity document not found or not uploaded yet");
            return res.redirect("/admin/dashboard");
        }

        // Check if user is admin or the document owner
        const isAdmin = req.user && req.user.isAdmin;
        const isOwner = req.user && req.user._id.toString() === userId;

        if (!isAdmin && !isOwner) {
            req.flash("error", "You don't have permission to view this document");
            return res.redirect("/admin/dashboard");
        }

        // Validate URL before redirecting
        if (!user.profile.identityDocument.url || user.profile.identityDocument.url === 'undefined') {
            req.flash("error", "Identity document URL is invalid. Please ask the user to upload a new document.");
            return res.redirect(`/admin/verification/${userId}`);
        }

        // Redirect to the document URL
        res.redirect(user.profile.identityDocument.url);
    } catch (error) {
        console.error("View document error:", error);
        req.flash("error", "Failed to view document");
        res.redirect("/listings");
    }
};



