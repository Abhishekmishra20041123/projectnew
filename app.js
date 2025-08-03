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
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));
const Review = require("./models/review.js");
const listingRouter = require("./routes/listing.js")
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
//authentication
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
//database
const Listing = require("./models/listing.js");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const db_url = process.env.ATLASDB_URL
async function main() {
   await mongoose.connect(db_url);
}
main().then(()=>{
    console.log("Database is connected!!!");
}).catch((err)=>{
    console.log(err);
});
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
app.listen(8080,()=>{
    console.log("Server is listening");
});

const store = MongoStore.create({
    mongoUrl:db_url,
    crypto:{
        secret:process.env.SECRET
    },
    touchAfter:24*3600
})
store.on("error",()=>{
    console.log("Error in mongo session store",err);
});
const sessionOption = {
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now() + 7*24*60*60*100,
        maxAge:7*24*60*60*100,
        httpOnly:true,
    }
}

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session()); //because of this when go from one page to another of website we dont require login for again and it automatically login there
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());  //add session of the user
passport.deserializeUser(User.deserializeUser()); //remove session of user


app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/demouser",async (req,res) =>{
//     let fakeUser = new User({
//         email:"student@gmail.com",
//         username:"student"
//     });

//    let registerUser = await User.register(fakeUser,"password");
//    res.send(registerUser);
// });
// const validateListing = (req,res,next)=>{
//     let {error}= listingSchema.validate(req.body);
//    if(error){
//     let errMsg = error.details.map((el)=>el.message).join(",");
//     throw new ExpressError(400,errMsg)
//    }
//    else
//    next()
// }
// const validateReview = (req,res,next)=>{
//     let {error}= reviewSchema.validate(req.body);
//    if(error){
//     let errMsg = error.details.map((el)=>el.message).join(",");
//     throw new ExpressError(400,errMsg)
//    }
//    else
//    next();
// }


app.use(methodOverride("_method"));
app.use("/listings",listingRouter)
app.use("/listings/:id/reviews",reviewRouter)
app.use("/",userRouter);
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

