const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const Payment = require('./models/payment.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find a booking with status 'pending' for testing
    const booking = await Booking.findOne({
      'status': 'pending'
    }).populate('payment');
    
    if (!booking) {
      console.log('No pending booking found for testing');
      process.exit(1);
    }
    
    console.log(`Found booking ${booking._id} with status ${booking.status}`);
    console.log(`Booking total: ₹${booking.total}`);
    
    if (booking.payment) {
      console.log(`Payment method: ${booking.payment.paymentMethod}`);
      console.log(`Payment status: ${booking.payment.status}`);
      if (booking.payment.transactionId) {
        console.log(`Transaction ID: ${booking.payment.transactionId}`);
      }
    } else {
      console.log('No payment record found');
    }
    
    console.log('\nThis booking is ready for testing host decline functionality.');
    console.log('When a host declines this booking, the system should:');
    console.log('1. Update booking status to "declined"');
    console.log('2. Process a 100% refund of ₹' + booking.total);
    console.log('3. Update payment status to "refunded"');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });