const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
// const ExpressError=require("../utils/ExpressError.js");
// const {listingSchema,reviewSchema} = require("../schema.js");
const {isloggedin,isOwner,validateListing} = require("../middlewear.js");
const listingController = require("../controllers/listing.js");
const multer = require("multer");
const {storage} = require("../cloudConfig.js");
const upload = multer({storage});


router
.route("/")
.get(wrapAsync(listingController.index))
.post(isloggedin
    ,validateListing
    ,upload.single('listing[image]'),
     wrapAsync(listingController.createlisting
    ));


//create - this must come before /:id route
router.get("/new",isloggedin,listingController.rendernewform);

router
.route("/:id")
.get(wrapAsync (listingController.showlisting))
.put(isloggedin,isOwner,upload.single('listing[image]'),validateListing,wrapAsync(listingController.updatelisting))
.delete(isloggedin,isOwner,wrapAsync(listingController.deletelisting));




// router.get("/",wrapAsync(listingController.index));

//show
//router.get("/:id",wrapAsync (listingController.showlisting));

//router.post("/", isloggedin,validateListing, wrapAsync(listingController.createlisting));

//update
//get on click edit listing/:id/edit to render editejs to put listing/:id
router.get("/:id/edit",isloggedin,isOwner,wrapAsync(listingController.rendoreditform));
//router.put("/:id",isloggedin,isOwner,validateListing,wrapAsync(listingController.updatelisting));
//delete
//router.delete("/:id",isloggedin,isOwner,wrapAsync(listingController.deletelisting));

module.exports =router;

// router.post("/",validateListing,wrapAsync(async (req,res,next)=>{
//        let result= listingSchema.validate(req.body);
//    if(result.error){
//     throw new ExpressError(500,result.error)
//    }
//         let {title,description,image,price,location,country}=req.body;
//     await Listing.insertOne({
//         title:title,
//         description:description,
//         image:image,
//         price:price,
//         location:location,
//         country:country
//     });
//     res.redirect("/listings");

// }));