const User = require("../models/user.js");

module.exports.signup = async(req,res)=>{
    try {
        let {username,email,password} = req.body;
    let newUser = new User({
        email:email,
        username:username,
    });
    const registerduser= await User.register(newUser,password);
    console.log(registerduser);
    req.login(registerduser,(err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","user is registered successfully");
       res.redirect("/listings");
    })
    } catch (error) {
       req.flash("error",error.message);
       res.redirect("/signup");
    }
};

module.exports.rendersignup = (req,res)=>{
    res.render("users/signup.ejs")
};

module.exports.renderlogin = (req,res)=>{
    res.render("users/login.ejs");
};

module.exports.login = async (req,res)=>{
    req.flash("success","welcome to mysite");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logout = (req,res)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","you are logout");
        res.redirect("/listings");
    })
};