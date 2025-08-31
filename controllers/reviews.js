const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
module.exports.createreview = async (req,res)=>{
      if(!req.user) {
          req.flash("error", "You must be logged in to create a review");
          return res.redirect("/login");
      }
      
      let {id} = req.params;
      let listing= await Listing.findById(id);
      if(!listing) {
          req.flash("error", "Listing not found");
          return res.redirect("/listings");
      }
      
      let newReview = new Review(req.body.review);
      newReview.author = req.user._id;
      listing.reviews.push(newReview);
      await newReview.save();
      await listing.save();
      req.flash("success","New review created");
      res.redirect(`/listings/${id}`)
};

module.exports.deletereview = async (req,res) => {
    if(!req.user) {
        req.flash("error", "You must be logged in to delete a review");
        return res.redirect("/login");
    }
    
    let {id,reviewid} = req.params;
    let listing = await Listing.findById(id);
    let review = await Review.findById(reviewid);
    
    if(!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }
    
    if(!review) {
        req.flash("error", "Review not found");
        return res.redirect(`/listings/${id}`);
    }
    
    await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewid}});
    await Review.findByIdAndDelete(reviewid);
    req.flash("success","review deleted");
    res.redirect(`/listings/${id}`)
 };