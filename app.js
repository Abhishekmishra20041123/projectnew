if(process.env.NODE_ENV != "production"){
     require("dotenv").config({quiet:true});
}

//console.log(process.env);  //env file ke variable ko acess karna  it cannotacess directly store sensetive info

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");
const {listingSchema,reviewSchema} = require("./schema.js");//server validation
const multer = require("multer");
app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");
app.use(express.urlencoded({extended:true}));
app.use(express.json()); // Add JSON parser for API requests
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));
const Review = require("./models/review.js");
const listingRouter = require("./routes/listing.js")
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const wishlistRouter = require("./routes/wishlist.js");
const bookingRouter = require("./routes/booking.js");
const paymentRouter = require("./routes/payment.js");
const paypalRouter = require("./routes/paypal.js");
const profileRouter = require("./routes/profile.js");
const adminRouter = require("./routes/admin.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
//authentication
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
//database
const Listing = require("./models/listing.js");
const connectDB = require("./config/database.js");
const listingController = require("./controllers/listing.js");

// Connect to database
connectDB();
// app.get("/test",async (req,res)=>{
//     let samplelisting = new Listing({
//         title:"villa khandala",
//         description:"sahbdjabhdkjahbd",
//         price:100,
//         location:"wedhwudhwuidhwuh",
//         country:"india"
//     });
//     await samplelisting.save();
//     console.log("sample saved");
//     res.send("sucessful testing");
// });
// Debug route to check bookings
app.get('/debug/bookings', async (req, res) => {
    try {
        const Booking = require('./models/booking.js');
        const bookings = await Booking.find().sort({createdAt: -1}).limit(10);
        
        res.json({
            totalBookings: bookings.length,
            message: bookings.length === 0 ? 'No bookings found in database' : `Found ${bookings.length} bookings`,
            bookings: bookings.map(booking => ({
                id: booking._id,
                listingId: booking.listing,
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
                nights: booking.nights,
                guests: booking.guests,
                total: booking.total,
                status: booking.status,
                createdAt: booking.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



app.listen(8080,()=>{
    console.log("Server is listening");
});

const store = MongoStore.create({
    mongoUrl: process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust",
    crypto:{
        secret:process.env.SECRET || "mysecretcode"
    },
    touchAfter:24*3600
})
store.on("error",()=>{
    console.log("Error in mongo session store",err);
});
const sessionOption = {
    store,
    secret: process.env.SECRET || "mysecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly: true,
    }
}

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session()); //because of this when go from one page to another of website we dont require login for again and it automatically login there
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());  //add session of the user
passport.deserializeUser(User.deserializeUser()); //remove session of user

// Middleware to refresh user data from database (ensures isAdmin field is up-to-date)
// This must be after passport.session() but before routes
app.use(async (req, res, next) => {
    if (req.isAuthenticated() && req.user && req.user._id) {
        try {
            // Refresh user data from database to get latest isAdmin status
            const freshUser = await User.findById(req.user._id);
            if (freshUser) {
                // Update req.user with fresh data (this updates the current request)
                // The session will be updated on next login, but this ensures current request has latest data
                req.user = freshUser;
            }
        } catch (error) {
            console.error("Error refreshing user data:", error);
        }
    }
    next();
});

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    res.locals.isAuthenticated = req.isAuthenticated();
    
    // Debug: Log admin status for Admin user
    if (req.user && req.user.username === 'Admin') {
        console.log(`[DEBUG] Admin user detected - isAdmin: ${req.user.isAdmin}, type: ${typeof req.user.isAdmin}`);
    }
    
    next();
});

app.use(methodOverride("_method", { methods: ['POST'] }));
app.use("/listings",listingRouter)
app.use("/listings/:id/reviews",reviewRouter)
app.use("/",userRouter);
app.use("/wishlist",wishlistRouter);
app.use("/bookings",bookingRouter);
app.use("/profile",profileRouter);
app.use("/admin",adminRouter);
app.use("/payments",paymentRouter);
// Mount paypal router as a nested route under bookings
app.use("/bookings",paypalRouter);

// Test map route
app.get("/testmap", listingController.testmap);

// app.get("/",(req,res)=>{
//     res.send("home route is on");
// });

// app.post("/listings",validateListing,wrapAsync(async (req,res,next)=>{
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
// //update
// //get on click edit listing/:id/edit to render editejs to put listing/:id
// 
// app.get("/listings/:id/edit",wrapAsync(async (req,res)=>{
//     let {id} = req.params;
//     const listdata = await Listing.findById(id);
//     res.render("listings/edit.ejs",{listdata});
// }));
// app.put("/listings/:id",validateListing,wrapAsync(async (req,res)=>{
//     let {id} = req.params;
//     await Listing.findByIdAndUpdate(id,{...req.body.listing});
//     res.redirect(`/listings/${id}`);
// }));
// //delete
// app.delete("/listings/:id",wrapAsync(async (req,res)=>{
//     let {id}=req.params;
//     await Listing.findByIdAndDelete(id);
//     res.redirect("/listings");
// }));

// //reviews
// app.post("/listings/:id/reviews",validateReview,wrapAsync(async (req,res)=>{
//       let {id} = req.params;
//       let listing= await Listing.findById(id);
//       let newReview = new Review(req.body.review);
//       listing.reviews.push(newReview);
//       await newReview.save();
//       await listing.save();
//       res.redirect(`/listings/${id}`)
// }))
//  //delete review
//  app.delete("/listings/:id/reviews/:reviewid",wrapAsync(async (req,res) => {
//     let {id,reviewid} = req.params;
    
//     await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewid}});
//     await Review.findByIdAndDelete(reviewid);
//     res.redirect(`/listings/${id}`)
//  }))

app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});
app.use((err,req,res,next)=>{
    let {status=500,message="Something went wrong"} = err;
    res.status(status).render("error.ejs",{err});
});


//creating schema with joi for server siide validation


//new route


