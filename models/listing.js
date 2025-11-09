const mongoose = require("mongoose");
const { listingSchema } = require("../schema");
const Schema = mongoose.Schema;
const Review = require("./review")

const listSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    image: {
        url: String,
        filename: String,
    },
    additionalImages: [{
        url: String,
        filename: String
    }],
    price: Number,
    location: String,
    country: String,
    propertyType: {
        type: String,
        enum: ['Entire place', 'Private room', 'Shared room', 'Hotel room'],
        default: 'Entire place'
    },
    accommodates: {
        type: Number,
        default: 1,
        min: 1
    },
    bedrooms: {
        type: Number,
        default: 1,
        min: 0
    },
    bathrooms: {
        type: Number,
        default: 1,
        min: 0.5
    },
    beds: {
        type: Number,
        default: 1,
        min: 1
    },
    amenities: [{
        type: String,
        enum: [
            'WiFi', 'Kitchen', 'Washer', 'Dryer', 'Air conditioning', 'Heating',
            'TV', 'Hair dryer', 'Iron', 'Laptop-friendly workspace', 'Pool',
            'Hot tub', 'Free parking', 'Gym', 'Breakfast', 'Pets allowed',
            'Smoking allowed', 'Suitable for events', 'Family/kid friendly',
            'Wheelchair accessible', 'Elevator', 'Fireplace', 'Buzzer/wireless intercom',
            'Doorman', 'Shampoo', 'Essentials', 'Hangers', 'Translation missing',
            'Carbon monoxide detector', 'Smoke detector', 'First aid kit',
            'Fire extinguisher', 'Lock on bedroom door'
        ]
    }],
    houseRules: {
        checkIn: {
            type: String,
            default: "3:00 PM"
        },
        checkOut: {
            type: String,
            default: "11:00 AM"
        },
        maxGuests: {
            type: Number,
            default: 1
        },
        minStay: {
            type: Number,
            default: 1
        },
        maxStay: {
            type: Number,
            default: 1125
        },
        smokingAllowed: {
            type: Boolean,
            default: false
        },
        petsAllowed: {
            type: Boolean,
            default: false
        },
        eventsAllowed: {
            type: Boolean,
            default: false
        },
        additionalRules: [{
            type: String
        }]
    },
    availability: {
        instantBook: {
            type: Boolean,
            default: false
        },
        minAdvanceNotice: {
            type: String,
            enum: ['Same day', '1 day', '2 days', '3 days', '1 week'],
            default: 'Same day'
        },
        maxAdvanceNotice: {
            type: String,
            enum: ['3 months', '6 months', '9 months', '12 months', 'All dates available'],
            default: '12 months'
        },
        blockedDates: [{
            type: Date
        }]
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    category: {
        type: String,
        enum: [
            'Trending',
            'Rooms',
            'Mountain Cities',
            'Castles',
            'Swimming Pools',
            'Camping Ground',
            'Cow Farms',
            'Bus Side',
            'Sea Beaches',
            'Vacant',
            'Hotel'
        ],
        required: true
    },
    rating: {
        overall: {
            type: Number,
            default: 5.0,
            min: 0,
            max: 5
        },
        cleanliness: {
            type: Number,
            default: 5.0,
            min: 0,
            max: 5
        },
        accuracy: {
            type: Number,
            default: 5.0,
            min: 0,
            max: 5  
        },
        checkIn: {
            type: Number,
            default: 5.0,
            min: 0,
            max: 5
        },
        communication: {
            type: Number,
            default: 5.0,
            min: 0,
            max: 5
        },
        location: {
            type: Number,
            default: 5.0,
            min: 0,
            max: 5
        },
        value: {
            type: Number,
            default: 5.0,
            min: 0,
            max: 5
        }
    },
    bookings: [{
        type: Schema.Types.ObjectId,
        ref: "Booking"
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

listSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

listSchema.post("findOneAndDelete", async (listing) => {
    if (listing)
        await Review.deleteMany({ _id: { $in: listing.reviews } });
})

const Listing = mongoose.model("Listing", listSchema);
module.exports = Listing;