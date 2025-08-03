const express = require("express");
const router = express.Router({mergeParams:true});
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError=require("../utils/ExpressError.js");
const reviewcontroller = require("../controllers/reviews.js")
const {listingSchema,reviewSchema} = require("../schema.js");
const {isloggedin,isOwner,validateListing,validateReview,isAuthor} = require("../middlewear.js")

//reviews
router.post("/",isloggedin,validateReview,wrapAsync(reviewcontroller.createreview));
 //delete review
router.delete("/:reviewid",isloggedin,isAuthor,wrapAsync(reviewcontroller.deletereview));

 module.exports = router;