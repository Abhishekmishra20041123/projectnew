const User = require("../models/user.js");

module.exports.signup = async(req,res,next)=>{
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

module.exports.logout = (req,res,next)=>{
    return new Promise((resolve, reject) => {
        try {
            console.log("=== LOGOUT REQUEST ===");
            console.log("Method:", req.method);
            console.log("URL:", req.url);
            console.log("Headers:", req.headers);
            console.log("Body:", req.body);
            console.log("User authenticated:", req.isAuthenticated());
            console.log("User:", req.user ? req.user.username : "Not logged in");
            console.log("Session ID:", req.sessionID);
            
            // Handle case where user is not logged in
            if (!req.isAuthenticated()) {
                console.log("User not authenticated, redirecting to login");
                req.flash("error", "You are not logged in");
                return resolve(res.redirect("/login"));
            }
            
            // Set flash message BEFORE logout
            req.flash("success", "You have been logged out successfully");
            
            // Perform logout operation
            req.logout((err) => {
                if(err){
                    console.error("Logout error:", err);
                    return reject(err);
                }
                console.log("User successfully logged out");
                
                // Don't destroy session immediately to preserve flash message
                // The session will be cleaned up by the session store
                console.log("Logout successful, redirecting to login");
                resolve(res.redirect("/login"));
            });
        } catch (error) {
            console.error("Exception in logout:", error);
            req.flash("error", "There was an error during logout");
            reject(error);
        }
    });
};