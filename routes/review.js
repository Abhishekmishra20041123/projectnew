const express = require("express");
const router = express.Router({mergeParams:true});
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError=require("../utils/ExpressError.js");
const reviewcontroller = require("../controllers/reviews.js")
const {listingSchema,reviewSchema} = require("../schema.js");
const {isloggedin,isOwner,validateListing,validateReview,isAuthor} = require("../middlewear.js")

//reviews
router.post("/",isloggedin,validateReview,wrapAsync(reviewcontroller.createreview));
//update review
router.put("/:reviewid",isloggedin,isAuthor,validateReview,wrapAsync(reviewcontroller.updatereview));
//delete review
router.delete("/:reviewid",isloggedin,isAuthor,wrapAsync(reviewcontroller.deletereview));
//toggle helpful
router.post("/:reviewid/helpful",isloggedin,wrapAsync(reviewcontroller.toggleHelpful));

 module.exports = router;