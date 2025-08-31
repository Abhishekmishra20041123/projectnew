const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const Payment = require('./models/payment.js');
const User = require('./models/user.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find our test booking
    const booking = await Booking.findById('68b35fe315cc461e9aa9d507');
    
    if (!booking) {
      console.log('Test booking not found');
      process.exit(0);
    }
    
    console.log('Found booking:', booking._id);
    console.log('Booking total:', booking.total);
    console.log('Current payment ID:', booking.paymentId);
    console.log('Current payment ref:', booking.payment);
    
    // Create a test payment record
    const user = await User.findOne();
    
    const payment = new Payment({
      booking: booking._id,
      user: user._id,
      amount: booking.total,
      currency: 'USD',
      paymentMethod: 'card',
      status: 'succeeded',
      description: `Test payment for booking ${booking._id}`,
      cardDetails: {
        last4: '1234',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2025
      },
      billingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'US'
      }
    });
    
    await payment.save();
    console.log('Created test payment:', payment._id);
    
    // Link the payment to the booking
    booking.payment = payment._id;
    booking.paymentId = payment._id;
    await booking.save();
    
    console.log('Linked payment to booking');
    console.log('Updated payment ID:', booking.paymentId);
    console.log('Updated payment ref:', booking.payment);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });