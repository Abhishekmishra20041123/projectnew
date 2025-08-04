const mongoose = require("mongoose");
const { listingSchema } = require("../schema");
const Schema = mongoose.Schema;
const Review = require("./review")
const listSchema = new Schema({
    title:{
        type:String,
        required:true
    },
    description : {
        type:String
    },
    image:{
        url:String,
        filename:String,
        },
    price:Number,
    location:String,
    country:String,
    reviews:[
        {
            type:Schema.Types.ObjectId,
            ref:"Review",
        },
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    geometry: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
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
  }
});

listSchema.post("findOneAndDelete",async (listing)=>{
    if(listing)
    await Review.deleteMany({_id:{$in:listing.reviews}});
})

const Listing = mongoose.model("Listing",listSchema);
module.exports=Listing;