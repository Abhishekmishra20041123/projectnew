const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    categoryRatings: {
        cleanliness: {
            type: Number,
            min: 1,
            max: 5,
            default: 5
        },
        communication: {
            type: Number,
            min: 1,
            max: 5,
            default: 5
        },
        checkIn: {
            type: Number,
            min: 1,
            max: 5,
            default: 5
        },
        accuracy: {
            type: Number,
            min: 1,
            max: 5,
            default: 5
        },
        location: {
            type: Number,
            min: 1,
            max: 5,
            default: 5
        },
        value: {
            type: Number,
            min: 1,
            max: 5,
            default: 5
        }
    },
    helpfulCount: {
        type: Number,
        default: 0
    },
    helpfulUsers: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    edited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    created_at: {
        type: Date,
        default: Date.now()
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

module.exports = mongoose.model("Review",reviewSchema);