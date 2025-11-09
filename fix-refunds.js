const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const Payment = require('./models/payment.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find the declined booking that hasn't been refunded yet
    const booking = await Booking.findById('68b35fe315cc461e9aa9d507').populate('payment');
    
    if (!booking) {
      console.log('Booking not found');
      process.exit(1);
    }
    
    console.log(`Found booking ${booking._id} with status ${booking.status}`);
    console.log(`Payment status: ${booking.payment?.status}`);
    
    // Process refund for this declined booking
    if (booking.payment && booking.payment.status === 'succeeded') {
      console.log('Processing 100% refund for declined booking...');
      
      // Update payment record
      booking.payment.status = 'refunded';
      booking.payment.refund = {
        amount: booking.total,
        reason: 'Host declined booking request',
        refundedAt: new Date(),
        refundId: 'REF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      };
      await booking.payment.save();
      
      console.log(`100% refund of ₹${booking.total} processed for declined booking ${booking._id}`);
    }
    
    console.log('\nRefund processing completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });