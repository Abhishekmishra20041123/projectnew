
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const ExpressError=require("./utils/ExpressError.js");
const {listingSchema,reviewSchema} = require("./schema.js");
module.exports.isloggedin = (req, res, next) => {
    if (!req.isAuthenticated()) {     //jaise hi login kare te hai to user session create hota hai aur authenticate ke liye yehi use hota req.user
        // ✅ Save referrer only for non-GET (e.g., DELETE via form)
        if (req.method !== "GET" && req.get("Referrer")) {
            req.session.redirectUrl = req.get("Referrer");
        } else if (req.method === "GET") {
            req.session.redirectUrl = req.originalUrl;
        }

        console.log("User not authenticated, redirecting to login from:", req.originalUrl);
        req.flash("error", "You must be logged in first");
        return res.redirect("/login");
    }
    next();
};


module.exports.saveredirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req,res,next) =>{
    let {id} = req.params;
    let listing = await Listing.findById(id);
    if(!listing.owner._id.equals(res.locals.currUser._id)){
        req.flash("error","you dont have permission");
      return  res.redirect(`/listings/${id}`);
    }
    next()
}
module.exports.validateListing = (req,res,next)=>{
    console.log("Request body before validation:", JSON.stringify(req.body, null, 2));
    
    // Skip validation for multipart form data (file uploads)
    if (req.is('multipart/form-data')) {
        console.log("Skipping validation for multipart form data");
        return next();
    }
    
    // Ensure we're validating only the listing part of the body
    // and allowing unknown keys to support image uploads and other fields
    const { error } = listingSchema.validate(req.body, { 
        allowUnknown: true,
        stripUnknown: false 
    });
    
    if (error) {
        console.log("Validation error:", error.details);
        const errMsg = error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    next();
}

module.exports.validateReview = (req,res,next)=>{
    let {error}= reviewSchema.validate(req.body);
   if(error){
    let errMsg = error.details.map((el)=>el.message).join(",");
    throw new ExpressError(400,errMsg)
   }
   else
   next();
}
module.exports.isAuthor = async (req,res,next) =>{
    let {id,reviewid} = req.params;
    let review = await Review.findById(reviewid);
    if(!review.author._id.equals(res.locals.currUser._id)){
        req.flash("error","you dont have permission");
      return  res.redirect(`/listings/${id}`);
    }
    next()
}

module.exports.isAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in first");
        return res.redirect("/login");
    }
    
    if (!req.user.isAdmin) {
        req.flash("error", "You don't have permission to access this page");
        return res.redirect("/listings");
    }
    
    next();
};