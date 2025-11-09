const mongoose = require('mongoose');
const Booking = require('./models/booking.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find all bookings and show their payment information
    const bookings = await Booking.find({});
    
    console.log(`Total bookings: ${bookings.length}\n`);
    
    for (const booking of bookings) {
      console.log(`Booking ID: ${booking._id}`);
      console.log(`  Status: ${booking.status}`);
      console.log(`  Total: ₹${booking.total}`);
      console.log(`  Payment ID: ${booking.payment || 'None'}`);
      console.log(`  Payment Status: ${booking.paymentStatus || 'None'}`);
      console.log(`  Check-in: ${booking.checkIn}`);
      console.log(`  Check-out: ${booking.checkOut}`);
      console.log('');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });