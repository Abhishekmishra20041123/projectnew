const mongoose = require('mongoose');
const Payment = require('./models/payment.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find payment records for the declined bookings
    const paymentIds = [
      '68b363105d570dd6dd2aad28',
      '68b365d1125c24db603dcb6c'
    ];
    
    for (const paymentId of paymentIds) {
      try {
        const payment = await Payment.findById(paymentId);
        if (payment) {
          console.log(`\nPayment ID: ${payment._id}`);
          console.log(`  Amount: ₹${payment.amount}`);
          console.log(`  Status: ${payment.status}`);
          console.log(`  Payment method: ${payment.paymentMethod}`);
          if (payment.refund) {
            console.log(`  Refund amount: ₹${payment.refund.amount}`);
            console.log(`  Refund reason: ${payment.refund.reason}`);
            console.log(`  Refunded at: ${payment.refund.refundedAt}`);
          }
        } else {
          console.log(`\nPayment ID: ${paymentId} - Not found`);
        }
      } catch (err) {
        console.log(`\nError finding payment ${paymentId}:`, err.message);
      }
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });