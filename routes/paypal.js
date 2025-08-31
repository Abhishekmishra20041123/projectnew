const express = require('express');
const router = express.Router();
const { isloggedin } = require('../middlewear.js');
const wrapAsync = require('../utils/wrapAsync.js');
const Booking = require('../models/booking.js');
const Payment = require('../models/payment.js');
const paypalIntegration = require('../utils/paypalIntegration.js');

// PayPal success callback
router.get('/:bookingId/paypal/success', isloggedin, wrapAsync(async (req, res) => {
    const { bookingId } = req.params;
    const { token, PayerID } = req.query;
    
    try {
        // Find the booking
        const booking = await Booking.findById(bookingId).populate('listing');
        if (!booking) {
            req.flash('error', 'Booking not found');
            return res.redirect('/listings');
        }
        
        // Verify user owns this booking
        if (booking.guest.toString() !== req.user._id.toString()) {
            req.flash('error', 'Unauthorized access');
            return res.redirect('/listings');
        }
        
        // Capture the PayPal payment
        const captureResult = await paypalIntegration.captureOrder(token);
        
        if (!captureResult.success) {
            req.flash('error', `Payment capture failed: ${captureResult.error}`);
            return res.redirect(`/bookings/${bookingId}/payment`);
        }
        
        // Create payment record
        const paymentData = {
            booking: booking._id,
            user: req.user._id,
            amount: booking.total,
            currency: captureResult.currency || 'USD',
            paymentMethod: 'paypal',
            status: captureResult.status === 'COMPLETED' ? 'succeeded' : 'pending',
            transactionId: captureResult.transactionId,
            paypalOrderId: token,
            description: `PayPal payment for booking ${booking._id}`,
            fees: {
                processingFee: Math.round(booking.total * 0.034 * 100) / 100, // 3.4% PayPal fee
                platformFee: Math.round(booking.total * 0.05 * 100) / 100 // 5% platform fee
            },
            metadata: {
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                source: 'paypal_redirect',
                payerEmail: captureResult.payerEmail
            }
        };
        
        const payment = new Payment(paymentData);
        await payment.save();
        
        // Link booking with payment
        booking.payment = payment._id;
        booking.paymentStatus = captureResult.status === 'COMPLETED' ? 'paid' : 'pending';
        booking.paymentId = payment._id;
        booking.status = 'confirmed'; // PayPal payments are immediately confirmed
        await booking.save();
        
        req.flash('success', 'PayPal payment successful! Your booking is confirmed.');
        res.redirect(`/bookings/${booking._id}/confirmation`);
        
    } catch (error) {
        console.error('PayPal success callback error:', error);
        req.flash('error', 'Payment processing failed. Please contact support.');
        res.redirect('/bookings/my-bookings');
    }
}));

// PayPal cancel callback
router.get('/:bookingId/paypal/cancel', isloggedin, wrapAsync(async (req, res) => {
    const { bookingId } = req.params;
    
    try {
        // Find and delete the pending booking
        const booking = await Booking.findById(bookingId);
        if (booking && booking.guest.toString() === req.user._id.toString()) {
            await Booking.findByIdAndDelete(bookingId);
        }
        
        req.flash('error', 'PayPal payment was cancelled. Your booking has been removed.');
        res.redirect('/listings');
        
    } catch (error) {
        console.error('PayPal cancel callback error:', error);
        req.flash('error', 'Payment was cancelled.');
        res.redirect('/listings');
    }
}));

// PayPal webhook handler (for production)
router.post('/webhook', express.raw({type: 'application/json'}), wrapAsync(async (req, res) => {
    try {
        // Verify webhook signature (implement PayPal webhook verification)
        const event = req.body;
        
        switch (event.event_type) {
            case 'PAYMENT.CAPTURE.COMPLETED':
                // Handle successful payment
                await handlePaymentCompleted(event);
                break;
                
            case 'PAYMENT.CAPTURE.DENIED':
                // Handle failed payment
                await handlePaymentFailed(event);
                break;
                
            default:
                console.log('Unhandled PayPal webhook event:', event.event_type);
        }
        
        res.status(200).send('OK');
        
    } catch (error) {
        console.error('PayPal webhook error:', error);
        res.status(500).send('Webhook processing failed');
    }
}));

// Helper function to handle completed payments
async function handlePaymentCompleted(event) {
    try {
        const captureId = event.resource.id;
        const customId = event.resource.custom_id; // Should contain booking ID
        
        if (customId) {
            const booking = await Booking.findById(customId);
            if (booking) {
                booking.paymentStatus = 'paid';
                booking.status = 'confirmed';
                await booking.save();
                
                // Update payment record if exists
                const payment = await Payment.findOne({ booking: booking._id });
                if (payment) {
                    payment.status = 'succeeded';
                    payment.transactionId = captureId;
                    await payment.save();
                }
            }
        }
    } catch (error) {
        console.error('Handle payment completed error:', error);
    }
}

// Helper function to handle failed payments
async function handlePaymentFailed(event) {
    try {
        const customId = event.resource.custom_id;
        
        if (customId) {
            const booking = await Booking.findById(customId);
            if (booking) {
                booking.paymentStatus = 'failed';
                booking.status = 'cancelled';
                await booking.save();
                
                // Update payment record if exists
                const payment = await Payment.findOne({ booking: booking._id });
                if (payment) {
                    payment.status = 'failed';
                    await payment.save();
                }
            }
        }
    } catch (error) {
        console.error('Handle payment failed error:', error);
    }
}

module.exports = router;
