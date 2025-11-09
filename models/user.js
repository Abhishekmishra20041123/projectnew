const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    profile: {
        firstName: {
            type: String,
            default: ""
        },
        lastName: {
            type: String,
            default: ""
        },
        bio: {
            type: String,
            default: ""
        },
        profilePicture: {
            url: String,
            filename: String
        },
        identityDocument: {
            url: String,
            filename: String
        },
        phone: {
            type: String,
            default: ""
        },
        dateOfBirth: {
            type: Date
        },
        address: {
            street: String,
            city: String,
            state: String,
            country: String,
            zipCode: String
        },
        languages: [{
            type: String
        }],
        verified: {
            email: {
                type: Boolean,
                default: false
            },
            phone: {
                type: Boolean,
                default: false
            },
            identity: {
                type: Boolean,
                default: false
            }
        }
    },
    host: {
        isHost: {
            type: Boolean,
            default: false
        },
        hostSince: {
            type: Date
        },
        responseRate: {
            type: Number,
            default: 0
        },
        responseTime: {
            type: String,
            default: "within a few hours"
        },
        superhost: {
            type: Boolean,
            default: false
        },
        hostRating: {
            type: Number,
            default: 5.0,
            min: 0,
            max: 5
        },
        totalReviews: {
            type: Number,
            default: 0
        }
    },
    guest: {
        preferences: {
            propertyType: [String],
            amenities: [String],
            priceRange: {
                min: Number,
                max: Number
            }
        },
        bookingHistory: [{
            type: Schema.Types.ObjectId,
            ref: "Booking"
        }]
    },
    isAdmin: {
        type: Boolean,
        default: false
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

userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);