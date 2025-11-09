const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const Payment = require('./models/payment.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find the cancelled booking
    const booking = await Booking.findById('68b35fa0bc54fb8dcc384865').populate('payment');
    
    console.log(`Booking ID: ${booking._id}`);
    console.log(`Status: ${booking.status}`);
    console.log(`Total: ₹${booking.total}`);
    
    if (booking.payment) {
      console.log(`Payment status: ${booking.payment.status}`);
      if (booking.payment.refund) {
        console.log(`Refund amount: ₹${booking.payment.refund.amount}`);
        console.log(`Refund reason: ${booking.payment.refund.reason}`);
      } else {
        console.log('No refund information found');
      }
    } else {
      console.log('No payment record found');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });