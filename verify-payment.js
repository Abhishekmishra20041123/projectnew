const mongoose = require('mongoose');
const Payment = require('./models/payment.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find the payment record
    const payment = await Payment.findById('68b365d1125c24db603dcb6c');
    
    console.log(`Payment status: ${payment.status}`);
    console.log(`Refund amount: ${payment.refund?.amount}`);
    console.log(`Refund reason: ${payment.refund?.reason}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });