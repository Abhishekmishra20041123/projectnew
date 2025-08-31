const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const wishlistSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    listings: [{
        type: Schema.Types.ObjectId,
        ref: "Listing"
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

wishlistSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model("Wishlist", wishlistSchema);