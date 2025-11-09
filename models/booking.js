const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    guest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    nights: {
        type: Number,
        required: true,
        min: 1
    },
    guests: {
        type: Number,
        required: true,
        min: 1
    },
    basePrice: {
        type: Number,
        required: true,
        min: 0
    },
    cleaningFee: {
        type: Number,
        required: true,
        min: 0
    },
    serviceFee: {
        type: Number,
        required: true,
        min: 0
    },
    taxes: {
        type: Number,
        required: true,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    specialRequests: {
        type: String,
        trim: true,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'declined', 'cancelled', 'completed'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        trim: true
    },
    paymentId: {
        type: String,
        trim: true
    },
    cancelledAt: {
        type: Date
    },
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancellationReason: {
        type: String,
        trim: true
    },
    hostNotes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    hostMessage: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    guestRating: {
        type: Number,
        min: 1,
        max: 5
    },
    guestReview: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    hostRating: {
        type: Number,
        min: 1,
        max: 5
    },
    hostReview: {
        type: String,
        trim: true,
        maxlength: 1000
    }
}, {
    timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ guest: 1, createdAt: -1 });
bookingSchema.index({ host: 1, createdAt: -1 });
bookingSchema.index({ listing: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ status: 1 });

// Virtual for formatted dates
bookingSchema.virtual('checkInFormatted').get(function() {
    return this.checkIn.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

bookingSchema.virtual('checkOutFormatted').get(function() {
    return this.checkOut.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Virtual for duration
bookingSchema.virtual('duration').get(function() {
    if (this.nights === 1) {
        return '1 night';
    }
    return `${this.nights} nights`;
});

// Virtual for status badge class
bookingSchema.virtual('statusBadgeClass').get(function() {
    const statusClasses = {
        'pending': 'badge bg-warning',
        'confirmed': 'badge bg-success',
        'declined': 'badge bg-danger',
        'cancelled': 'badge bg-danger',
        'completed': 'badge bg-info'
    };
    return statusClasses[this.status] || 'badge bg-secondary';
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
    const now = new Date();
    const daysUntilCheckIn = Math.ceil((this.checkIn - now) / (1000 * 60 * 60 * 24));
    
    // Can cancel if more than 24 hours before check-in
    return daysUntilCheckIn > 1;
};

// Method to calculate refund amount
bookingSchema.methods.calculateRefund = function() {
    if (!this.canBeCancelled()) {
        return 0; // No refund if too close to check-in
    }
    
    // Full refund if cancelled more than 7 days before check-in
    const daysUntilCheckIn = Math.ceil((this.checkIn - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilCheckIn > 7) {
        return this.total;
    } else if (daysUntilCheckIn > 3) {
        // 50% refund if cancelled 3-7 days before
        return this.total * 0.5;
    } else {
        // 25% refund if cancelled 1-3 days before
        return this.total * 0.25;
    }
};

// Static method to check availability
bookingSchema.statics.checkAvailability = async function(listingId, checkIn, checkOut) {
    const conflictingBookings = await this.find({
        listing: listingId,
        status: { $nin: ['cancelled', 'declined'] },
        $or: [
            {
                checkIn: { $lt: checkOut },
                checkOut: { $gt: checkIn }
            }
        ]
    });
    
    return conflictingBookings.length === 0;
};

// Pre-save middleware to validate dates
bookingSchema.pre('save', function(next) {
    // Only validate date constraints for new bookings, not updates
    if (this.isNew) {
        if (this.checkOut <= this.checkIn) {
            const error = new Error('Check-out date must be after check-in date');
            return next(error);
        }
        
        // Get current date and set to beginning of day for fair comparison
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Set checkIn date to beginning of day for comparison
        const checkInDate = new Date(this.checkIn);
        const checkInDay = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
        
        // Compare dates at the day level to avoid time zone issues
        if (checkInDay < today) {
            const error = new Error('Check-in date cannot be in the past');
            return next(error);
        }
    }
    
    next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;