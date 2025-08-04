const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
    const { category } = req.query;
    let allist;

    if (!category || category.trim() === "") {
        // No category selected, show all
        allist = await Listing.find({});
    } else {
        // Filter by selected category
        allist = await Listing.find({ category });
    }

    res.render("./listings/index.ejs", { allist, category });
};



module.exports.rendernewform = (req,res)=>{   //it shouldbe write before /listings/:id this method because then new will act as variable like search in google
    res.render("listings/new.ejs");
};

module.exports.showlisting = async (req,res)=>{
    let {id} = req.params;
    const listdata = await Listing.findById(id)
    .populate({path:"reviews",
        populate:{
            path:"author",
        },
    })
    .populate("owner");
    if(!listdata){
        req.flash("error","list does not exist");
        res.redirect("/listings");
    }else
    res.render("./listings/show.ejs",{listdata})
};

module.exports.createlisting = async (req, res) => {
   let response=await geocodingClient.forwardGeocode({
     query: req.body.listing.location,
     limit: 1
   })
  .send();
   let url =  req.file.path;
   let filename = req.file.filename;
    const newListing = new Listing(req.body.listing); 
    newListing.owner = req.user._id;
    newListing.image = {url,filename};
    newListing.geometry = response.body.features[0].geometry;
   let savedlist= await newListing.save(); 
   console.log(savedlist);
    req.flash("success","New listing created");
    res.redirect("/listings");
};

module.exports.rendoreditform = async (req,res)=>{
    let {id} = req.params;
    const listdata = await Listing.findById(id);
    if(!listdata){
        req.flash("error","list does not exist");
        res.redirect("/listings");
    }
    let originalimageurl = listdata.image.url;
    originalimageurl= originalimageurl.replace("/upload","/upload/w_300");
    res.render("listings/edit.ejs",{listdata,originalimageurl});
};

module.exports.updatelisting =async (req,res)=>{
    let {id} = req.params;
    let listing=await Listing.findByIdAndUpdate(id,{...req.body.listing});
    if(typeof req.file !== "undefined"){
        let url =  req.file.path;
        let filename = req.file.filename;
        listing.image = {url,filename};
        await listing.save();
    }
    req.flash("success","listing updated");
    res.redirect(`/listings/${id}`);
};

module.exports.deletelisting = async (req,res)=>{
    let {id}=req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success","listing Deleted");
    res.redirect("/listings");
};

module.exports.searchListings = async (req, res) => {
    let query = req.query.q;
    if (!query) {
        return res.redirect("/listings");
    }

    const listings = await Listing.find({
        $or: [
            { country: { $regex: query, $options: "i" } },
            { location: { $regex: query, $options: "i" } },
            { title: { $regex: query, $options: "i" } }
        ]
    });

    res.render("listings/index.ejs", { allist: listings });
};
