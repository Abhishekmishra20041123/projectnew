const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveredirectUrl } = require("../middlewear.js");
const usercontroller = require("../controllers/users.js")
router
.route("/signup")
.get(usercontroller.rendersignup)
.post(wrapAsync(usercontroller.signup));

router
.route("/login")
.get(usercontroller.renderlogin)
.post(saveredirectUrl,
    passport.authenticate("local",{failureRedirect:"/login",failureFlash:true})
    ,usercontroller.login);

router.get("/logout",usercontroller.logout)

module.exports = router;

