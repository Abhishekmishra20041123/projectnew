const Payment = require("../models/payment.js");
const Booking = require("../models/booking.js");

// Demo payment processing
module.exports.processPayment = async (req, res) => {
    try {
        const { bookingId, paymentMethod } = req.body;
        
        const booking = await Booking.findById(bookingId)
            .populate("listing", "title price")
            .populate("guest", "username email");

        if (!booking) {
            req.flash("error", "Booking not found");
            return res.redirect("/bookings");
        }

        // Check if user is authorized
        if (booking.guest._id.toString() !== req.user._id.toString()) {
            req.flash("error", "You are not authorized to make this payment");
            return res.redirect("/bookings");
        }

        // Create payment record
        const payment = new Payment({
            booking: bookingId,
            user: req.user._id,
            amount: booking.total,  // Fixed: was totalPrice
            paymentMethod: paymentMethod || 'demo',
            status: 'processing',
            description: `Payment for ${booking.listing.title}`,
            transactionId: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

        await payment.save();

        // Simulate payment processing delay
        setTimeout(async () => {
            try {
                // Simulate successful payment (90% success rate for demo)
                const isSuccess = Math.random() > 0.1;
                
                if (isSuccess) {
                    payment.status = 'succeeded';
                    booking.paymentStatus = 'paid';
                    booking.status = 'confirmed';
                    booking.paymentId = payment._id;
                } else {
                    payment.status = 'failed';
                    booking.paymentStatus = 'failed';
                }

                await payment.save();
                await booking.save();
            } catch (error) {
                console.error('Payment processing error:', error);
            }
        }, 2000);

        req.flash("success", "Payment is being processed. You will be notified once completed.");
        res.redirect(`/bookings/${bookingId}`);

    } catch (error) {
        console.error(error);
        req.flash("error", "Payment processing failed");
        res.redirect("/bookings");
    }
};

// Show payment form
module.exports.showPaymentForm = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId)
            .populate("listing", "title image price location")
            .populate("host", "username profile");

        if (!booking) {
            req.flash("error", "Booking not found");
            return res.redirect("/bookings");
        }

        // Check if user is authorized
        if (booking.guest.toString() !== req.user._id.toString()) {
            req.flash("error", "You are not authorized to access this payment");
            return res.redirect("/bookings");
        }

        res.render("payments/form.ejs", { booking });
    } catch (error) {
        req.flash("error", "Something went wrong");
        res.redirect("/bookings");
    }
};

// Get payment status
module.exports.getPaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findById(id);
        
        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }

        res.json({
            status: payment.status,
            transactionId: payment.transactionId,
            amount: payment.amount
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to get payment status" });
    }
};