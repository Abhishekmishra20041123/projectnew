const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const Payment = require("../models/payment.js");
const User = require("../models/user.js");

// Show booking form
module.exports.showBookingForm = async (req, res) => {
    try {
        const { id } = req.params;
        const { checkIn, checkOut, adults, children, infants } = req.query;
        
        const listing = await Listing.findById(id).populate("owner");
        
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }

        // Check availability for the selected dates
        let unavailableDates = [];
        if (checkIn && checkOut) {
            const existingBookings = await Booking.find({
                listing: id,
                status: { $in: ['confirmed', 'pending'] },
                $or: [
                    {
                        checkIn: { $lte: new Date(checkOut) },
                        checkOut: { $gte: new Date(checkIn) }
                    }
                ]
            });

            unavailableDates = existingBookings.map(booking => ({
                start: booking.checkIn.toISOString().split('T')[0],
                end: booking.checkOut.toISOString().split('T')[0]
            }));
        }

        res.render("bookings/new.ejs", { 
            listing, 
            prefilledData: { checkIn, checkOut, adults, children, infants },
            unavailableDates: JSON.stringify(unavailableDates)
        });
    } catch (error) {
        console.error("Error showing booking form:", error);
        req.flash("error", "Something went wrong");
        res.redirect("/listings");
    }
};

// Create booking
module.exports.createBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { checkIn, checkOut, adults, children, infants, specialRequests } = req.body;
        
        const listing = await Listing.findById(id).populate("owner");
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }

        // Validate dates
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (checkInDate < today) {
            req.flash("error", "Check-in date cannot be in the past");
            return res.redirect(`/bookings/listings/${id}/book`);
        }

        if (checkOutDate <= checkInDate) {
            req.flash("error", "Check-out date must be after check-in date");
            return res.redirect(`/bookings/listings/${id}/book`);
        }

        // Check if dates are available using the model's static method
        const isAvailable = await Booking.checkAvailability(id, checkInDate, checkOutDate);
        
        if (!isAvailable) {
            req.flash("error", "Selected dates are not available. Please choose different dates.");
            return res.redirect(`/bookings/listings/${id}/book?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}&infants=${infants}`);
        }

        // Validate guest count
        const totalGuests = parseInt(adults) + parseInt(children || 0);
        if (listing.accommodates && totalGuests > listing.accommodates) {
            req.flash("error", `This property can accommodate maximum ${listing.accommodates} guests`);
            return res.redirect(`/bookings/listings/${id}/book`);
        }

        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const subtotal = nights * listing.price;
        const serviceFee = Math.round(subtotal * 0.14);
        const cleaningFee = listing.cleaningFee || 0;
        const totalPrice = subtotal + serviceFee + cleaningFee;

        const booking = new Booking({
            listing: id,
            guest: req.user._id,
            host: listing.owner._id,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests: parseInt(adults) || 1,
            basePrice: listing.price,
            cleaningFee: cleaningFee,
            serviceFee: serviceFee,
            taxes: 0, // Add taxes field as required by model
            total: totalPrice,
            nights,
            specialRequests: specialRequests || '',
            status: 'pending',
            paymentStatus: 'pending'
        });

        await booking.save();
        
        // Add booking to listing
        listing.bookings.push(booking._id);
        await listing.save();

        req.flash("success", "Booking request submitted successfully! The host will review your request.");
        res.redirect(`/bookings/${booking._id}`);
    } catch (error) {
        console.error("Error creating booking:", error);
        req.flash("error", "Failed to create booking. Please try again.");
        res.redirect(`/listings/${req.params.id}`);
    }
};

// Show booking details
module.exports.showBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id)
            .populate("listing")
            .populate("guest", "username email profile")
            .populate("host", "username email profile");

        if (!booking) {
            req.flash("error", "Booking not found");
            return res.redirect("/listings");
        }

        // Check if user is authorized to view this booking
        if (booking.guest._id.toString() !== req.user._id.toString() && 
            booking.host._id.toString() !== req.user._id.toString()) {
            req.flash("error", "You are not authorized to view this booking");
            return res.redirect("/listings");
        }

        // Calculate cancellation policy details
        const now = new Date();
        const checkIn = new Date(booking.checkIn);
        const daysUntilCheckIn = Math.ceil((checkIn - now) / (1000 * 60 * 60 * 24));
        
        let cancellationPolicy = {
            canCancel: true,
            refundAmount: 0,
            penaltyFee: 0
        };

        if (booking.status === 'confirmed' && daysUntilCheckIn > 0) {
            if (daysUntilCheckIn >= 7) {
                cancellationPolicy.refundAmount = booking.total;  // Fixed: was totalPrice
            } else if (daysUntilCheckIn >= 1) {
                cancellationPolicy.refundAmount = booking.total * 0.5;  // Fixed: was totalPrice
                cancellationPolicy.penaltyFee = booking.total * 0.5;  // Fixed: was totalPrice
            } else {
                cancellationPolicy.refundAmount = 0;
                cancellationPolicy.penaltyFee = booking.total;  // Fixed: was totalPrice
            }
        }

        res.render("bookings/show.ejs", { booking, cancellationPolicy });
    } catch (error) {
        console.error("Error showing booking:", error);
        req.flash("error", "Something went wrong");
        res.redirect("/listings");
    }
};

// Update booking status (for hosts)
module.exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, message } = req.body;
        
        const booking = await Booking.findById(id).populate("listing").populate("guest");
        
        if (!booking) {
            req.flash("error", "Booking not found");
            return res.redirect("/dashboard/host");
        }

        // Check if user is the host
        if (booking.host.toString() !== req.user._id.toString()) {
            req.flash("error", "You are not authorized to update this booking");
            return res.redirect("/dashboard/host");
        }

        const oldStatus = booking.status;
        booking.status = status;
        
        if (message) {
            booking.hostMessage = message;
        }

        if (status === 'confirmed') {
            booking.confirmedAt = new Date();
        } else if (status === 'cancelled') {
            booking.cancelledAt = new Date();
            booking.cancelledBy = 'host';
        }

        await booking.save();

        // Send notification logic could be added here
        
        const statusMessages = {
            'confirmed': 'Booking confirmed successfully!',
            'cancelled': 'Booking has been declined',
            'pending': 'Booking updated'
        };
        
        req.flash("success", statusMessages[status] || 'Booking updated');
        res.redirect(`/bookings/${id}`);
    } catch (error) {
        console.error("Error updating booking status:", error);
        req.flash("error", "Failed to update booking");
        res.redirect("/dashboard/host");
    }
};

// Cancel booking (for guests)
module.exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id).populate("listing");
        
        if (!booking) {
            req.flash("error", "Booking not found");
            return res.redirect("/dashboard/guest");
        }

        // Check if user is the guest
        if (booking.guest.toString() !== req.user._id.toString()) {
            req.flash("error", "You are not authorized to cancel this booking");
            return res.redirect("/dashboard/guest");
        }

        // Check if booking can be cancelled
        if (booking.status === 'cancelled' || booking.status === 'completed') {
            req.flash("error", "This booking cannot be cancelled");
            return res.redirect(`/bookings/${id}`);
        }

        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        booking.cancelledBy = 'guest';

        await booking.save();

        req.flash("success", "Booking cancelled successfully");
        res.redirect(`/bookings/${id}`);
    } catch (error) {
        console.error("Error cancelling booking:", error);
        req.flash("error", "Failed to cancel booking");
        res.redirect("/dashboard/guest");
    }
};

// Get user's bookings with enhanced filtering
module.exports.getUserBookings = async (req, res) => {
    try {
        const { type, status, sort } = req.query;
        let query = {};
        let sortOptions = {};

        // Set up query based on user type
        if (type === 'host') {
            query.host = req.user._id;
        } else {
            query.guest = req.user._id;
        }

        // Filter by status if specified
        if (status && status !== 'all') {
            query.status = status;
        }

        // Set up sorting
        switch (sort) {
            case 'date_asc':
                sortOptions.checkIn = 1;
                break;
            case 'date_desc':
                sortOptions.checkIn = -1;
                break;
            case 'price_asc':
                sortOptions.total = 1;  // Fixed: was totalPrice
                break;
            case 'price_desc':
                sortOptions.total = -1;  // Fixed: was totalPrice
                break;
            default:
                sortOptions.createdAt = -1;
        }

        const bookings = await Booking.find(query)
            .populate("listing", "title image location price propertyType")
            .populate(type === 'host' ? "guest" : "host", "username profile")
            .sort(sortOptions);

        // Group bookings by status for better organization
        const groupedBookings = {
            upcoming: bookings.filter(b => b.status === 'confirmed' && new Date(b.checkIn) > new Date()),
            pending: bookings.filter(b => b.status === 'pending'),
            past: bookings.filter(b => b.status === 'completed' || (b.status === 'confirmed' && new Date(b.checkOut) < new Date())),
            cancelled: bookings.filter(b => b.status === 'cancelled')
        };

        res.render("bookings/list.ejs", { 
            bookings, 
            groupedBookings,
            type: type || 'guest',
            currentStatus: status || 'all',
            currentSort: sort || 'newest'
        });
    } catch (error) {
        console.error("Error fetching user bookings:", error);
        req.flash("error", "Failed to load bookings");
        res.redirect("/listings");
    }
};

// Check date availability (API endpoint)
module.exports.checkAvailability = async (req, res) => {
    try {
        const { listingId, checkIn, checkOut } = req.query;

        const existingBookings = await Booking.find({
            listing: listingId,
            status: { $nin: ['cancelled', 'declined'] },
            $or: [
                {
                    checkIn: { $lt: new Date(checkOut) },
                    checkOut: { $gt: new Date(checkIn) }
                }
            ]
        });

        res.json({
            available: existingBookings.length === 0,
            conflictingBookings: existingBookings.length
        });
    } catch (error) {
        console.error("Error checking availability:", error);
        res.status(500).json({ error: "Failed to check availability" });
    }
};

// Get booking calendar data
module.exports.getBookingCalendar = async (req, res) => {
    try {
        const { listingId, month, year } = req.query;
        
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const bookings = await Booking.find({
            listing: listingId,
            status: { $in: ['confirmed', 'pending'] },
            $or: [
                { checkIn: { $gte: startDate, $lte: endDate } },
                { checkOut: { $gte: startDate, $lte: endDate } },
                { checkIn: { $lte: startDate }, checkOut: { $gte: endDate } }
            ]
        }).populate("guest", "username");

        const calendarData = bookings.map(booking => ({
            start: booking.checkIn.toISOString().split('T')[0],
            end: booking.checkOut.toISOString().split('T')[0],
            status: booking.status,
            guest: booking.guest.username,
            id: booking._id
        }));

        res.json(calendarData);
    } catch (error) {
        console.error("Error fetching calendar data:", error);
        res.status(500).json({ error: "Failed to fetch calendar data" });
    }
};