const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const User = require('./models/user.js');
const Listing = require('./models/listing.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find a user to use as guest and host
    const user = await User.findOne();
    if (!user) {
      console.log('No users found in database');
      process.exit(1);
    }
    
    console.log('Using user:', user.username, user._id);
    
    // Find the listing we just created
    const listing = await Listing.findById('68b35f8f401b1355e85bce03');
    if (!listing) {
      console.log('Test listing not found');
      process.exit(1);
    }
    
    console.log('Using listing:', listing.title, listing._id);
    
    // Create a test booking for future dates
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10); // 10 days from now
    
    const checkOutDate = new Date(futureDate);
    checkOutDate.setDate(checkOutDate.getDate() + 3); // 3 nights stay
    
    const booking = new Booking({
      listing: listing._id,
      guest: user._id,
      host: listing.owner || user._id, // Use listing owner or fallback to user
      checkIn: futureDate,
      checkOut: checkOutDate,
      nights: 3,
      guests: 2,
      basePrice: 300,
      cleaningFee: 30,
      serviceFee: 42,
      taxes: 30,
      total: 402,
      status: 'confirmed',
      paymentStatus: 'paid'
    });
    
    try {
      await booking.save();
      console.log('Test booking created successfully!');
      console.log('Booking ID:', booking._id);
      console.log('Check-in:', booking.checkIn);
      console.log('Status:', booking.status);
      
      process.exit(0);
    } catch (error) {
      console.error('Error creating booking:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });