const mongoose = require('mongoose');
const Booking = require('./models/booking.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find all declined bookings
    const declinedBookings = await Booking.find({ status: 'declined' });
    
    console.log(`Declined bookings: ${declinedBookings.length}`);
    
    declinedBookings.forEach(booking => {
      console.log(`\nBooking ID: ${booking._id}`);
      console.log(`  Total: ₹${booking.total}`);
      console.log(`  Created: ${booking.createdAt}`);
      console.log(`  Declined: ${booking.respondedAt || 'N/A'}`);
      console.log(`  Payment: ${booking.payment || 'N/A'}`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });