const mongoose = require('mongoose');
const Payment = require('./models/payment.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Reset the test payment status to succeeded
    const payment = await Payment.findById('68b363105d570dd6dd2aad28');
    
    if (!payment) {
      console.log('Test payment not found');
      process.exit(0);
    }
    
    console.log('Found payment:', payment._id, 'with current status:', payment.status);
    
    // Reset the payment status
    payment.status = 'succeeded';
    payment.refund = undefined;
    await payment.save();
    
    console.log('Payment status reset to succeeded');
    console.log('New status:', payment.status);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });