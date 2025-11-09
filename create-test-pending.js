const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const User = require('./models/user.js');
const Listing = require('./models/listing.js');
const Payment = require('./models/payment.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find a user and listing
    const user = await User.findOne();
    const listing = await Listing.findById('68b35f8f401b1355e85bce03');
    
    // Create a new test booking for future dates
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 20); // 20 days from now
    
    const checkOutDate = new Date(futureDate);
    checkOutDate.setDate(checkOutDate.getDate() + 3); // 3 nights stay
    
    const newBooking = new Booking({
      listing: listing._id,
      guest: user._id,
      host: listing.owner || user._id,
      checkIn: futureDate,
      checkOut: checkOutDate,
      nights: 3,
      guests: 2,
      basePrice: 300,
      cleaningFee: 30,
      serviceFee: 42,
      taxes: 30,
      total: 402,
      status: 'pending',
      paymentStatus: 'paid'
    });
    
    await newBooking.save();
    console.log('New test booking created:', newBooking._id);
    
    // Create a payment for this booking
    const payment = new Payment({
      booking: newBooking._id,
      user: user._id,
      amount: newBooking.total,
      currency: 'USD',
      paymentMethod: 'card',
      status: 'succeeded',
      description: `Test payment for booking ${newBooking._id}`,
      cardDetails: {
        last4: '5678',
        brand: 'MasterCard',
        expiryMonth: 11,
        expiryYear: 2026
      },
      billingAddress: {
        street: '456 Test Ave',
        city: 'Testville',
        state: 'TV',
        zipCode: '54321',
        country: 'US'
      }
    });
    
    await payment.save();
    console.log('Created test payment:', payment._id);
    
    // Link the payment to the booking
    newBooking.payment = payment._id;
    newBooking.paymentId = payment._id;
    await newBooking.save();
    
    console.log('Linked payment to booking');
    console.log('Booking status:', newBooking.status);
    console.log('Payment status:', payment.status);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });