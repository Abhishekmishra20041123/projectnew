const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
    booking: {
        type: Schema.Types.ObjectId,
        ref: "Booking",
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'paypal', 'bank', 'upi', 'demo'],
        required: true
    },
    // Card payment details
    cardDetails: {
        last4: String,
        brand: String,
        expiryMonth: Number,
        expiryYear: Number
    },
    // Billing address
    billingAddress: {
        street: {
            type: String,
            required: function() { return this.paymentMethod === 'card'; }
        },
        city: {
            type: String,
            required: function() { return this.paymentMethod === 'card'; }
        },
        state: {
            type: String,
            required: function() { return this.paymentMethod === 'card'; }
        },
        zipCode: {
            type: String,
            required: function() { return this.paymentMethod === 'card'; }
        },
        country: {
            type: String,
            default: 'US'
        }
    },
    // Payment processor details
    paymentIntentId: String,
    paypalOrderId: String,
    bankTransferReference: String,
    upiTransactionId: String,
    upiReference: String,
    
    status: {
        type: String,
        enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled'],
        default: 'pending'
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    description: String,
    
    // Fees and breakdown
    fees: {
        processingFee: { type: Number, default: 0 },
        platformFee: { type: Number, default: 0 }
    },
    
    // Refund information
    refund: {
        amount: Number,
        reason: String,
        refundedAt: Date,
        refundId: String
    },
    
    // Metadata for tracking
    metadata: {
        ipAddress: String,
        userAgent: String,
        source: { type: String, default: 'web' }
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for better performance
paymentSchema.index({ booking: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
    return `₹${this.amount.toFixed(2)}`;
});

// Method to check if payment is successful
paymentSchema.methods.isSuccessful = function() {
    return this.status === 'succeeded';
};

// Method to check if payment can be refunded
paymentSchema.methods.canRefund = function() {
    return this.status === 'succeeded' && !this.refund.amount;
};

// Static method to find payments by booking
paymentSchema.statics.findByBooking = function(bookingId) {
    return this.find({ booking: bookingId }).sort({ createdAt: -1 });
};

paymentSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Generate transaction ID if not exists
    if (!this.transactionId && this.status === 'succeeded') {
        this.transactionId = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    next();
});

module.exports = mongoose.model("Payment", paymentSchema);