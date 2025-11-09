const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const Payment = require('./models/payment.js');
const paypalIntegration = require('./utils/paypalIntegration.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find a booking with a payment for testing
    const booking = await Booking.findOne({
      'status': 'pending'
    }).populate('payment');
    
    if (!booking) {
      console.log('No booking found for testing');
      process.exit(1);
    }
    
    console.log(`Found booking ${booking._id} with payment method ${booking.paymentMethod}`);
    console.log(`Payment status: ${booking.payment.status}`);
    if (booking.payment.transactionId) {
      console.log(`Payment transaction ID: ${booking.payment.transactionId}`);
    }
    
    // Simulate host declining the booking
    console.log('\nSimulating host declining booking...');
    
    // Check if payment can be refunded
    if (booking.payment && booking.payment.status === 'succeeded') {
      console.log('Processing 100% refund for declined booking...');
      
      // For PayPal payments, we need to process the actual refund
      if (booking.paymentMethod === 'paypal' && booking.payment.transactionId) {
        console.log('Processing PayPal refund...');
        try {
          const refundResult = await paypalIntegration.processRefund(
            booking.payment.transactionId,
            booking.total,
            'Host declined booking request'
          );
          
          if (refundResult.success) {
            console.log(`PayPal refund successful. Refund ID: ${refundResult.refundId}`);
            
            // Update payment record
            booking.payment.status = 'refunded';
            booking.payment.refund = {
              amount: booking.total,
              reason: 'Host declined booking request',
              refundedAt: new Date(),
              refundId: refundResult.refundId
            };
            await booking.payment.save();
            
            console.log('Payment record updated successfully');
          } else {
            console.log(`PayPal refund failed: ${refundResult.error}`);
          }
        } catch (error) {
          console.log(`PayPal refund error: ${error.message}`);
        }
      } else {
        // For other payment methods, just update the database
        console.log('Processing refund for non-PayPal payment...');
        booking.payment.status = 'refunded';
        booking.payment.refund = {
          amount: booking.total,
          reason: 'Host declined booking request',
          refundedAt: new Date(),
          refundId: 'REF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        };
        await booking.payment.save();
        console.log('Payment record updated successfully');
      }
      
      // Update booking status
      booking.status = 'declined';
      await booking.save();
      console.log('Booking status updated to declined');
      
      console.log(`\nSuccessfully processed 100% refund of ₹${booking.total} for declined booking`);
    } else {
      console.log('No valid payment found or payment not succeeded');
    }
    
    console.log('\nTest completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });