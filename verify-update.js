const mongoose = require('mongoose');
const Booking = require('./models/booking.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find the booking we just updated
    const booking = await Booking.findById('68b365d1125c24db603dcb6a');
    
    console.log(`Booking status: ${booking.status}`);
    console.log(`Booking payment: ${booking.payment}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });