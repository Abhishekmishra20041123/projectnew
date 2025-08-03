const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
module.exports.createreview = async (req,res)=>{
      let {id} = req.params;
      let listing= await Listing.findById(id);
      let newReview = new Review(req.body.review);
      newReview.author = req.user._id;
      listing.reviews.push(newReview);
      await newReview.save();
      await listing.save();
      req.flash("success","New review created");
      res.redirect(`/listings/${id}`)
};

module.exports.deletereview = async (req,res) => {
    let {id,reviewid} = req.params;
    await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewid}});
    await Review.findByIdAndDelete(reviewid);
    req.flash("success","review deleted");
    res.redirect(`/listings/${id}`)
 };