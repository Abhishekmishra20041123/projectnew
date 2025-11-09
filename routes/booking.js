const express = require('express');
const router = express.Router();
const { isloggedin } = require('../middlewear.js');
const wrapAsync = require('../utils/wrapAsync.js');

// Debug route to test booking functionality
router.get('/debug', isloggedin, wrapAsync(async (req, res) => {
    try {
        const Booking = require('../models/booking.js');
        const User = require('../models/user.js');
        
        const userInfo = {
            id: req.user._id,
            username: req.user.username,
            isAuthenticated: req.isAuthenticated()
        };
        
        const bookingCount = await Booking.countDocuments({ guest: req.user._id });
        const totalBookings = await Booking.countDocuments();
        
        res.json({
            success: true,
            user: userInfo,
            userBookings: bookingCount,
            totalBookings: totalBookings,
            message: 'Booking system is working correctly'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
}));

// Test page for cancellation
router.get('/test-cancel', isloggedin, (req, res) => {
    res.render('bookings/test-cancel', { title: 'Test Cancellation' });
});

// Test route for cancellation
router.post('/test-cancel/:id', isloggedin, wrapAsync(async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Test cancel route hit with ID:', id);
        
        const Booking = require('../models/booking.js');
        const booking = await Booking.findById(id);
        
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found!' });
        }
        
        console.log('Found booking:', booking._id, 'with status:', booking.status);
        
        // Update booking status for testing
        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        booking.cancelledBy = req.user._id;
        await booking.save();
        
        console.log(`Test: Booking ${id} cancelled successfully`);
        res.json({ success: true, message: 'Booking cancelled successfully for testing!' });
    } catch (error) {
        console.error('Error in test cancellation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}));

// Default route - Redirect from /bookings to /bookings/my-bookings
router.get('/', isloggedin, (req, res) => {
    console.log('Redirecting from /bookings to /bookings/my-bookings');
    res.redirect('/bookings/my-bookings');
});

// Get user's bookings
router.get('/my-bookings', isloggedin, wrapAsync(async (req, res) => {
    console.log('Accessing my-bookings route');
    try {
        const Booking = require('../models/booking.js');
        
        // Use lean() for better performance and handle missing references gracefully
        const bookings = await Booking.find({ guest: req.user._id })
            .populate({
                path: 'listing',
                select: 'title image location price',
                options: { strictPopulate: false }
            })
            .populate({
                path: 'payment',
                select: 'status amount method',
                options: { strictPopulate: false }
            })
            .sort({ createdAt: -1 })
            .lean();
        
        console.log(`Found ${bookings.length} bookings for user ${req.user.username}`);
        
        // Filter out bookings with deleted listings if needed
        const validBookings = bookings.filter(booking => booking.listing || booking.total);
        
        res.render('bookings/my-bookings', { 
            bookings: validBookings,
            title: 'My Bookings'
        });
    } catch (error) {
        console.error('Error loading my bookings:', error);
        console.error('Error stack:', error.stack);
        req.flash('error', 'Failed to load your bookings. Please try again.');
        res.redirect('/listings');
    }
}));

// Show booking form for a specific listing - handle both GET and POST
router.get('/listings/:id/book', isloggedin, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut, guests, adults, children, infants, nights, basePrice, serviceFee, taxes, totalPrice } = req.query;
    
    // Get listing details
    const Listing = require('../models/listing.js');
    const listing = await Listing.findById(id).populate('owner');
    
    if (!listing) {
        req.flash('error', 'Listing not found!');
        return res.redirect('/listings');
    }
    
    // Check if user is trying to book their own listing
    if (req.user._id.equals(listing.owner._id)) {
        req.flash('error', 'You cannot book your own listing!');
        return res.redirect(`/listings/${id}`);
    }
    
    // Parse and validate dates if provided
    let parsedCheckIn = '';
    let parsedCheckOut = '';
    
    if (checkIn) {
        try {
            parsedCheckIn = new Date(checkIn).toISOString().split('T')[0];
        } catch (e) {
            parsedCheckIn = '';
        }
    }
    
    if (checkOut) {
        try {
            parsedCheckOut = new Date(checkOut).toISOString().split('T')[0];
        } catch (e) {
            parsedCheckOut = '';
        }
    }

    res.render('bookings/book', { 
        listing, 
        checkIn: parsedCheckIn, 
        checkOut: parsedCheckOut,
        guests: parseInt(guests) || 1,
        adults: parseInt(adults) || 1,
        children: parseInt(children) || 0,
        infants: parseInt(infants) || 0,
        nights: parseInt(nights) || '',
        basePrice: parseFloat(basePrice) || '',
        serviceFee: parseFloat(serviceFee) || '',
        taxes: parseFloat(taxes) || '',
        calculatedTotal: parseFloat(totalPrice) || '',
        title: `Book ${listing.title}`
    });
}));

// Process booking submission
router.post('/listings/:id/book', isloggedin, wrapAsync(async (req, res) => {
    // Check if this is a form submission from show page (has nights, basePrice, etc.)
    if (req.body.nights && req.body.basePrice) {
        const { checkIn, checkOut, guests, adults, children, infants, nights, basePrice, serviceFee, taxes, totalPrice } = req.body;
        
        // Redirect to GET route with query parameters to maintain the same flow
        const queryParams = new URLSearchParams({
            checkIn: checkIn || '',
            checkOut: checkOut || '',
            guests: guests || 1,
            adults: adults || 1,
            children: children || 0,
            infants: infants || 0,
            nights: nights || '',
            basePrice: basePrice || '',
            serviceFee: serviceFee || '',
            taxes: taxes || '',
            totalPrice: totalPrice || ''
        });
        
        return res.redirect(`/bookings/listings/${id}/book?${queryParams.toString()}`);
    }
    
    // Otherwise, process as booking submission
    const { id } = req.params;
    const { checkIn, checkOut, guests, specialRequests } = req.body;
    
    // Validate that required fields are present
    if (!checkIn || !checkOut) {
        req.flash('error', 'Please select both check-in and check-out dates.');
        return res.redirect(`/bookings/listings/${id}/book`);
    }
    
    // Validate dates with proper error handling
    let checkInDate, checkOutDate;
    try {
        checkInDate = new Date(checkIn);
        checkOutDate = new Date(checkOut);
        
        // Check if dates are valid
        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
            req.flash('error', 'Invalid date format. Please select valid dates.');
            return res.redirect(`/bookings/listings/${id}/book`);
        }
    } catch (error) {
        req.flash('error', 'Invalid date format. Please select valid dates.');
        return res.redirect(`/bookings/listings/${id}/book`);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate < today) {
        req.flash('error', 'Check-in date cannot be in the past!');
        return res.redirect(`/bookings/listings/${id}/book`);
    }
    
    if (checkOutDate <= checkInDate) {
        req.flash('error', 'Check-out date must be after check-in date!');
        return res.redirect(`/bookings/listings/${id}/book`);
    }
    
    // Calculate nights and total price
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    // Get listing for price calculation
    const Listing = require('../models/listing.js');
    const listing = await Listing.findById(id);
    
    if (!listing) {
        req.flash('error', 'Listing not found!');
        return res.redirect('/listings');
    }
    
    const basePrice = listing.price * nights;
    const cleaningFee = Math.round(basePrice * 0.1);
    const serviceFee = Math.round(basePrice * 0.14);
    const taxes = Math.round((basePrice + cleaningFee + serviceFee) * 0.12);
    const total = basePrice + cleaningFee + serviceFee + taxes;
    
    // Create booking object
    const booking = {
        listing: id,
        guest: req.user._id,
        host: listing.owner,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        guests: parseInt(guests) || 1,
        basePrice,
        cleaningFee,
        serviceFee,
        taxes,
        total,
        specialRequests: specialRequests || '',
        status: 'pending', // pending, confirmed, cancelled, completed
        createdAt: new Date()
    };
    
    // Check for availability before proceeding
    const Booking = require('../models/booking.js');
    const isAvailable = await Booking.checkAvailability(id, checkInDate, checkOutDate);
    
    if (!isAvailable) {
        req.flash('error', 'Sorry, this listing is not available for the selected dates. Please choose different dates.');
        return res.redirect(`/bookings/listings/${id}/book?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${guests}`);
    }
    
    // Store booking in session for payment processing
    req.session.pendingBooking = booking;
    
    // Redirect to payment page
    res.redirect(`/bookings/${id}/payment`);
}));

// Show payment page
router.get('/:id/payment', isloggedin, async (req, res) => {
    const { id } = req.params;
    let booking = req.session.pendingBooking;
    
    // If no session booking, try to get from localStorage data (client-side)
    if (!booking || booking.listing.toString() !== id) {
        // For now, we'll create a basic booking object from the listing
        try {
            const Listing = require('../models/listing.js');
            const listing = await Listing.findById(id).populate('owner');
            
            if (!listing) {
                req.flash('error', 'Listing not found!');
                return res.redirect('/listings');
            }
            
            // Create a basic booking object for display
            const basePrice = listing.price * 1; // 1 night default
            const cleaningFee = Math.round(basePrice * 0.1);
            const serviceFee = Math.round(basePrice * 0.14);
            const taxes = Math.round((basePrice + cleaningFee + serviceFee) * 0.12);
            const total = basePrice + cleaningFee + serviceFee + taxes;
            
            booking = {
                listing: id,
                listingTitle: listing.title,
                listingImage: listing.image?.url,
                price: listing.price,
                checkIn: req.query.checkIn || '',
                checkOut: req.query.checkOut || '',
                guests: parseInt(req.query.guests) || 1,
                nights: 1, // Will be calculated on client side
                basePrice: basePrice,
                cleaningFee: cleaningFee,
                serviceFee: serviceFee,
                taxes: taxes,
                total: total,
                isFromListing: true // Flag to indicate this came directly from listing
            };
        } catch (error) {
            console.error('Error creating booking object:', error);
            req.flash('error', 'Unable to load listing details!');
            return res.redirect(`/listings/${id}`);
        }
    }
    
    res.render('bookings/payment', { 
        booking: booking,
        currUser: req.user,
        title: 'Complete Your Booking'
    });
});

// Process payment with enhanced billing address handling
router.post('/:id/payment', isloggedin, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { 
        checkIn, checkOut, guests, specialRequests,
        paymentMethod, cardNumber, cardHolder, expiry, cvv,
        billingAddress, billingCity, billingState, billingZip,
        upiId
    } = req.body;
    
    let bookingData;
    
    // Check if we have a session booking or need to create from form data
    if (req.session.pendingBooking && req.session.pendingBooking.listing.toString() === id) {
        bookingData = req.session.pendingBooking;
    } else {
        // Create booking from form data (coming directly from listing)
        try {
            const Listing = require('../models/listing.js');
            const listing = await Listing.findById(id);
            
            if (!listing) {
                req.flash('error', 'Listing not found!');
                return res.redirect(`/listings/${id}`);
            }
            
            // Validate dates
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (checkInDate < today) {
                req.flash('error', 'Check-in date cannot be in the past!');
                return res.redirect(`/bookings/listings/${id}/book`);
            }
            
            if (checkOutDate <= checkInDate) {
                req.flash('error', 'Check-out date must be after check-in date!');
                return res.redirect(`/bookings/listings/${id}/book`);
            }
            
            // Calculate nights and total price
            const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
            const basePrice = listing.price * nights;
            const cleaningFee = Math.round(basePrice * 0.1);
            const serviceFee = Math.round(basePrice * 0.14);
            const taxes = Math.round((basePrice + cleaningFee + serviceFee) * 0.12);
            const total = basePrice + cleaningFee + serviceFee + taxes;
            
            // Create booking data
            bookingData = {
                listing: id,
                guest: req.user._id,
                host: listing.owner,
                checkIn: checkInDate,
                checkOut: checkOutDate,
                nights: nights,
                guests: parseInt(guests) || 1,
                basePrice: basePrice,
                cleaningFee: cleaningFee,
                serviceFee: serviceFee,
                taxes: taxes,
                total: total,
                specialRequests: specialRequests || '',
                status: 'pending',
                paymentStatus: 'pending',
                isFromListing: true
            };
            
            // Check for availability before proceeding
            const Booking = require('../models/booking.js');
            const isAvailable = await Booking.checkAvailability(id, checkInDate, checkOutDate);
            
            if (!isAvailable) {
                req.flash('error', 'Sorry, this listing is not available for the selected dates. Please choose different dates.');
                return res.redirect(`/bookings/listings/${id}/book?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${guests}`);
            }
        } catch (error) {
            console.error('Error creating booking data:', error);
            req.flash('error', 'Failed to process booking data');
            return res.redirect(`/listings/${id}`);
        }
    }
    
    try {
        // Create the actual booking in the database first
        const Booking = require('../models/booking.js');
        const newBooking = new Booking(bookingData);
        
        // Check for availability before saving
        const isAvailable = await Booking.checkAvailability(
            bookingData.listing,
            bookingData.checkIn,
            bookingData.checkOut
        );
        
        if (!isAvailable) {
            req.flash('error', 'Sorry, this listing is not available for the selected dates. Please choose different dates.');
            return res.redirect(`/bookings/listings/${id}/book?checkIn=${encodeURIComponent(bookingData.checkIn.toISOString().split('T')[0])}&checkOut=${encodeURIComponent(bookingData.checkOut.toISOString().split('T')[0])}&guests=${bookingData.guests}`);
        }
        
        await newBooking.save();
        
        // Prepare payment data
        const paymentService = require('../utils/paymentService.js');
        const paymentData = {
            amount: bookingData.total,
            currency: 'USD',
            paymentMethod: paymentMethod || 'card',
            billingAddress: paymentMethod === 'card' ? {
                street: billingAddress,
                city: billingCity,
                state: billingState,
                zipCode: billingZip,
                country: 'US'
            } : null,
            cardDetails: paymentMethod === 'card' ? {
                cardNumber: cardNumber,
                cardHolder: cardHolder,
                expiry: expiry,
                cvv: cvv
            } : null,
            upiId: paymentMethod === 'upi' ? upiId : null
        };
        
        // Get client metadata
        const metadata = {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            source: 'web'
        };
        
        // Handle PayPal payment differently - redirect to PayPal
        if (paymentMethod === 'paypal') {
            const paypalIntegration = require('../utils/paypalIntegration.js');
            
            const paypalOrderData = {
                bookingId: newBooking._id,
                total: bookingData.total,
                basePrice: bookingData.basePrice,
                taxes: bookingData.taxes,
                cleaningFee: bookingData.cleaningFee,
                serviceFee: bookingData.serviceFee,
                nights: bookingData.nights,
                listingTitle: 'Accommodation Booking'
            };
            
            const returnUrl = `${req.protocol}://${req.get('host')}/bookings/${newBooking._id}/paypal/success`;
            const cancelUrl = `${req.protocol}://${req.get('host')}/bookings/${newBooking._id}/paypal/cancel`;
            
            const paypalResult = await paypalIntegration.createOrder(paypalOrderData, returnUrl, cancelUrl);
            
            if (!paypalResult.success) {
                await Booking.findByIdAndDelete(newBooking._id);
                req.flash('error', `PayPal setup failed: ${paypalResult.error}`);
                return res.redirect(`/bookings/${id}/payment`);
            }
            
            // Store PayPal order ID in booking for later reference
            newBooking.paypalOrderId = paypalResult.orderId;
            newBooking.paymentStatus = 'pending';
            await newBooking.save();
            
            // Redirect to PayPal for payment
            return res.redirect(paypalResult.approvalUrl);
        }
        
        // Process other payment methods through payment service
        const paymentResult = await paymentService.processPayment(
            newBooking._id,
            req.user._id,
            paymentData,
            metadata
        );
        
        if (!paymentResult.success) {
            // Delete the booking if payment failed
            await Booking.findByIdAndDelete(newBooking._id);
            req.flash('error', `Payment failed: ${paymentResult.error}`);
            return res.redirect(`/bookings/${id}/payment`);
        }
        
        // Link the booking with the payment
        newBooking.payment = paymentResult.payment._id;
        
        // Update booking with payment information
        newBooking.paymentStatus = paymentResult.payment.status === 'succeeded' ? 'paid' : 'pending';
        newBooking.paymentId = paymentResult.payment._id;
        
        // If bank transfer, keep booking as pending until manual verification
        if (paymentMethod === 'bank') {
            newBooking.status = 'pending_payment';
            newBooking.paymentStatus = 'pending';
        }
        
        await newBooking.save();
        
        // Also update the payment with the booking reference
        const Payment = require('../models/payment.js');
        const payment = await Payment.findById(paymentResult.payment._id);
        if (payment) {
            payment.booking = newBooking._id;
            await payment.save();
        }
        
        // Clear the pending booking from session
        delete req.session.pendingBooking;
        
        // Set appropriate success message based on payment method
        let successMessage = 'Booking confirmed! Check your email for details.';
        if (paymentMethod === 'bank') {
            successMessage = 'Booking created! Please complete the bank transfer using the provided reference number.';
        } else if (paymentMethod === 'paypal') {
            successMessage = 'PayPal payment successful! Your booking is confirmed.';
        } else if (paymentMethod === 'upi') {
            successMessage = 'UPI payment successful! Your booking is confirmed instantly.';
        }
        
        req.flash('success', successMessage);
        res.redirect(`/bookings/${newBooking._id}/confirmation`);
        
    } catch (error) {
        console.error('Payment processing error:', error);
        req.flash('error', 'Payment processing failed. Please try again.');
        res.redirect(`/bookings/${id}/payment`);
    }
}));

// Show booking confirmation
router.get('/:id/confirmation', isloggedin, wrapAsync(async (req, res) => {
    const { id } = req.params;
    
    const Booking = require('../models/booking.js');
    const booking = await Booking.findById(id)
        .populate('listing')
        .populate('guest')
        .populate('host');
    
    if (!booking) {
        req.flash('error', 'Booking not found!');
        return res.redirect('/listings');
    }
    
    // Check if user owns this booking or is the host
    if (!req.user._id.equals(booking.guest._id) && !req.user._id.equals(booking.host._id)) {
        req.flash('error', 'Access denied!');
        return res.redirect('/listings');
    }
    
    res.render('bookings/confirmation', { 
        booking,
        title: 'Booking Confirmed',
        currUser: req.user
    });
}));

// Show booking response page (for hosts)
router.get('/:id/respond', isloggedin, wrapAsync(async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Route params:`, req.params);
        console.log(`Accessing respond page for booking ${id}`);
        
        if (!id) {
            console.log('No booking ID provided');
            req.flash('error', 'No booking ID provided');
            return res.redirect('/bookings/host-bookings');
        }
        
        const Booking = require('../models/booking.js');
        const booking = await Booking.findById(id)
            .populate({
                path: 'listing',
                populate: { path: 'owner' }
            })
            .populate('guest')
            .populate('host');
        
        if (!booking) {
            console.log(`Booking ${id} not found`);
            req.flash('error', 'Booking not found!');
            return res.redirect('/bookings/host-bookings');
        }
        
        // Debug logging with safety checks
        const listingOwnerId = booking.listing?.owner?._id;
        console.log(`Listing owner: ${listingOwnerId}, Current user: ${req.user._id}`);
        
        // Check if user is the host of the listing (not the booking host field)
        if (!req.user || !booking.listing || !listingOwnerId || req.user._id.toString() !== listingOwnerId.toString()) {
            console.log('Access denied: User is not the listing owner');
            console.log(`User ID: ${req.user._id}, Listing Owner ID: ${listingOwnerId}`);
            req.flash('error', 'Access denied! Only listing owners can respond to bookings.');
            return res.redirect('/bookings/' + id + '/confirmation');
        }
        
        // Ensure all required fields exist before rendering
        if (!booking.listing || !booking.guest) {
            console.log('Missing required booking data');
            req.flash('error', 'Booking data is incomplete. Please try again.');
            return res.redirect('/bookings/host-bookings');
        }
        
        res.render('bookings/response', { 
            booking,
            title: 'Respond to Booking Request',
            currUser: req.user,
            bookingId: id
        });
    } catch (error) {
        console.error('Error accessing respond page:', error);
        req.flash('error', 'An error occurred. Please try again.');
        return res.redirect('/bookings/host-bookings');
    }
}));

// Process booking response (for hosts)
router.post('/:id/respond', isloggedin, wrapAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const { status, message } = req.body;
        
        console.log(`Processing response for booking ${id}. Status: ${status}, Message: ${message}`);
        console.log(`Request body:`, req.body);
        console.log(`User ID: ${req.user._id}`);
        
        // Validate required fields
        if (!status) {
            console.log('Missing status field');
            req.flash('error', 'Please select either Confirm or Decline.');
            return res.redirect(`/bookings/${id}/respond`);
        }
        
        console.log(`Status is valid: ${status}`);
        
        // Sanitize and validate message (optional field)
        const sanitizedMessage = message ? message.trim().substring(0, 1000) : '';
        
        const Booking = require('../models/booking.js');
        const Payment = require('../models/payment.js');
        const paypalIntegration = require('../utils/paypalIntegration.js');
        
        const booking = await Booking.findById(id)
            .populate({
                path: 'listing',
                populate: { path: 'owner' }
            })
            .populate('guest')
            .populate('host')
            .populate('payment');
        
        if (!booking) {
            console.log(`Booking ${id} not found`);
            req.flash('error', 'Booking not found!');
            return res.redirect('/bookings/host-bookings');
        }
        
        console.log('Booking found:', booking);
        
        // Debug logging with safety checks
        const listingOwnerId = booking.listing?.owner?._id;
        console.log(`Listing owner: ${listingOwnerId}, Current user: ${req.user._id}`);
        
        // Check if user is the host of the listing (not the booking host field)
        if (!req.user || !booking.listing || !listingOwnerId || req.user._id.toString() !== listingOwnerId.toString()) {
            console.log('Access denied: User is not the listing owner');
            console.log(`User ID: ${req.user._id}, Listing Owner ID: ${listingOwnerId}`);
            req.flash('error', 'Access denied! Only listing owners can respond to bookings.');
            return res.redirect('/bookings/' + id + '/confirmation');
        }
        
        // Handle refund if host is declining the booking
        if (status === 'decline' && booking.payment) {
            const payment = await Payment.findById(booking.payment);
            if (payment && payment.status === 'succeeded') {
                // Process 100% refund when host declines
                let refundSuccess = true;
                let refundError = null;
                
                // For PayPal payments, process actual refund through PayPal API
                if (payment.paymentMethod === 'paypal' && payment.transactionId) {
                    try {
                        const refundResult = await paypalIntegration.processRefund(
                            payment.transactionId,
                            booking.total,
                            'Host declined booking request'
                        );
                        
                        if (!refundResult.success) {
                            refundSuccess = false;
                            refundError = refundResult.error;
                            console.error('PayPal refund failed:', refundError);
                        } else {
                            console.log(`PayPal refund successful. Refund ID: ${refundResult.refundId}`);
                        }
                    } catch (paypalError) {
                        refundSuccess = false;
                        refundError = paypalError.message;
                        console.error('PayPal refund error:', paypalError);
                    }
                }
                
                // If refund was successful (or for non-PayPal payments), update payment record
                if (refundSuccess) {
                    payment.status = 'refunded';
                    payment.refund = {
                        amount: booking.total,
                        reason: 'Host declined booking request',
                        refundedAt: new Date(),
                        refundId: 'REF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                    };
                    await payment.save();
                    
                    console.log(`100% refund of ₹${booking.total.toFixed(2)} processed for declined booking ${id}`);
                } else {
                    // If refund failed, still update status but add error information
                    console.error(`Failed to process refund for booking ${id}:`, refundError);
                    req.flash('error', `Booking declined but refund failed: ${refundError}. Please contact support.`);
                }
            }
        }
        
        // Update booking with host message and status
        booking.hostMessage = sanitizedMessage;
        booking.status = status === 'confirm' ? 'confirmed' : 'declined';
        booking.respondedAt = new Date();
        await booking.save();
        
        console.log(`Booking ${id} updated with status: ${booking.status}`);
        
        // Add refund information to flash message when declining
        if (status === 'decline') {
            req.flash('success', `Booking declined successfully! A full refund of ₹${booking.total.toFixed(2)} will be processed to the guest's original payment method.`);
        } else {
            req.flash('success', `Booking confirmed successfully!`);
        }
        
        res.redirect(`/bookings/${id}/confirmation`);
    } catch (error) {
        console.error('Error processing booking response:', error);
        req.flash('error', 'An error occurred. Please try again.');
        return res.redirect(`/bookings/${id}/respond`);
    }
}));

// Show host's bookings (bookings for their listings)
router.get('/host-bookings', isloggedin, wrapAsync(async (req, res) => {
    try {
        console.log('Accessing host-bookings route');
        const Booking = require('../models/booking.js');
        // Find bookings for listings owned by this user
        const Listing = require('../models/listing.js');
        const userListings = await Listing.find({ owner: req.user._id }).select('_id');
        const listingIds = userListings.map(l => l._id);
        
        const bookings = await Booking.find({ listing: { $in: listingIds } })
            .populate({
                path: 'listing',
                select: 'title image location price',
                options: { strictPopulate: false }
            })
            .populate({
                path: 'guest',
                select: 'username email profile',
                options: { strictPopulate: false }
            })
            .sort({ createdAt: -1 })
            .lean();
        
        console.log(`Found ${bookings.length} bookings for host ${req.user._id}`);
        
        // Filter out bookings with deleted listings or guests if needed
        const validBookings = bookings.filter(booking => booking.listing && booking.guest);
        
        res.render('bookings/host-bookings', { 
            bookings: validBookings,
            title: 'Host Bookings',
            currUser: req.user
        });
    } catch (error) {
        console.error('Error loading host bookings:', error);
        console.error('Error stack:', error.stack);
        req.flash('error', 'Failed to load host bookings. Please try again.');
        res.redirect('/profile/dashboard/host');
    }
}));

// Cancel booking
router.post('/:id/cancel', isloggedin, wrapAsync(async (req, res) => {
    try {
        const { id } = req.params;
        
        const Booking = require('../models/booking.js');
        const Payment = require('../models/payment.js');
        
        const booking = await Booking.findById(id).populate('payment');
        
        if (!booking) {
            req.flash('error', 'Booking not found!');
            return res.redirect('/bookings/my-bookings');
        }
        
        // Check if user can cancel this booking
        if (!req.user._id.equals(booking.guest._id) && !req.user._id.equals(booking.host._id)) {
            req.flash('error', 'Access denied! Only the booking guest or host can cancel a booking.');
            return res.redirect('/bookings/my-bookings');
        }
        
        // Check if booking is already cancelled
        if (booking.status === 'cancelled') {
            req.flash('info', 'This booking has already been cancelled.');
            return res.redirect('/bookings/my-bookings');
        }
        
        // Check if check-in date is in the past
        if (new Date(booking.checkIn) <= new Date()) {
            req.flash('error', 'Cannot cancel a booking with a check-in date in the past.');
            return res.redirect('/bookings/my-bookings');
        }
        
        // Calculate refund amount based on cancellation policy
        const now = new Date();
        const checkIn = new Date(booking.checkIn);
        const daysUntilCheckIn = Math.ceil((checkIn - now) / (1000 * 60 * 60 * 24));
        
        let refundPercentage = 0;
        let refundAmount = 0;
        let refundReason = '';
        
        if (daysUntilCheckIn > 7) {
            refundPercentage = 100;
            refundAmount = booking.total;
            refundReason = 'Full refund (more than 7 days before check-in)';
        } else if (daysUntilCheckIn > 3) {
            refundPercentage = 50;
            refundAmount = booking.total * 0.5;
            refundReason = '50% refund (3-7 days before check-in)';
        } else if (daysUntilCheckIn > 1) {
            refundPercentage = 25;
            refundAmount = booking.total * 0.25;
            refundReason = '25% refund (1-3 days before check-in)';
        } else {
            refundPercentage = 0;
            refundAmount = 0;
            refundReason = 'No refund (less than 24 hours before check-in)';
        }
        
        // Update booking status
        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        booking.cancelledBy = req.user._id;
        await booking.save();
        
        // If there's a refund amount and a payment, update the payment record
        if (refundAmount > 0 && booking.payment) {
            const payment = await Payment.findById(booking.payment);
            if (payment && payment.status === 'succeeded') {
                // Update payment with refund information
                payment.status = 'refunded';
                payment.refund = {
                    amount: refundAmount,
                    reason: refundReason,
                    refundedAt: new Date(),
                    refundId: 'REF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                };
                await payment.save();
                
                console.log(`Refund of ₹${refundAmount.toFixed(2)} processed for booking ${id}`);
            }
        }
        
        // Add refund information to flash message
        if (refundAmount > 0) {
            req.flash('success', `Booking cancelled successfully! A refund of ₹${refundAmount.toFixed(2)} (${refundPercentage}%) will be processed to your original payment method.`);
        } else {
            req.flash('success', 'Booking cancelled successfully! No refund will be issued as per the cancellation policy.');
        }
        
        console.log(`Booking ${id} cancelled successfully by user ${req.user._id} with ${refundPercentage}% refund`);
        
        // Always redirect to my-bookings page after cancellation
        return res.redirect('/bookings/my-bookings');
    } catch (error) {
        console.error('Error cancelling booking:', error);
        req.flash('error', 'An error occurred while cancelling the booking. Please try again.');
        return res.redirect('/bookings/my-bookings');
    }
}));

module.exports = router;