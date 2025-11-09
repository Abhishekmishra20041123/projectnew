const mongoose = require('mongoose');
const Booking = require('./models/booking.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find all declined bookings
    const declinedBookings = await Booking.find({ status: 'declined' }).populate('payment');
    
    console.log(`Declined bookings: ${declinedBookings.length}`);
    
    declinedBookings.forEach(booking => {
      console.log(`\nBooking ID: ${booking._id}`);
      console.log(`  Total: ₹${booking.total}`);
      console.log(`  Created: ${booking.createdAt}`);
      console.log(`  Declined: ${booking.respondedAt || 'N/A'}`);
      console.log(`  Payment status: ${booking.payment?.status || 'N/A'}`);
      if (booking.payment?.refund) {
        console.log(`  Refund amount: ₹${booking.payment.refund.amount}`);
        console.log(`  Refund reason: ${booking.payment.refund.reason}`);
        console.log(`  Refunded at: ${booking.payment.refund.refundedAt}`);
      }
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });