const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isloggedin } = require("../middlewear.js");
const paymentController = require("../controllers/payments.js");

// Show payment form
router.get("/booking/:bookingId", isloggedin, wrapAsync(paymentController.showPaymentForm));

// Process payment
router.post("/process", isloggedin, wrapAsync(paymentController.processPayment));

// Get payment status
router.get("/:id/status", isloggedin, wrapAsync(paymentController.getPaymentStatus));

module.exports = router;