const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const User = require('./models/user.js');
const Listing = require('./models/listing.js');

// Use the same connection logic as the main app
const connectDB = require('./config/database.js');

// Connect to database
connectDB().then(async () => {
    console.log('Connected to MongoDB');
    
    // Create a test user and listing if they don't exist
    let user = await User.findOne();
    if (!user) {
      user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpassword'
      });
      await user.save();
    }
    
    let listing = await Listing.findOne();
    if (!listing) {
      listing = new Listing({
        title: 'Test Listing for Cancelled Booking Test',
        description: 'Test listing for cancelled booking availability testing',
        price: 100,
        location: 'Test Location',
        country: 'Test Country',
        geometry: {
          type: 'Point',
          coordinates: [0, 0]
        },
        owner: user._id
      });
      await listing.save();
    }
    
    console.log('Using listing:', listing.title);
    
    // Test 1: Create a cancelled booking
    const checkIn1 = new Date();
    checkIn1.setDate(checkIn1.getDate() + 10);
    
    const checkOut1 = new Date(checkIn1);
    checkOut1.setDate(checkOut1.getDate() + 3);
    
    const cancelledBooking = new Booking({
      listing: listing._id,
      guest: user._id,
      host: user._id,
      checkIn: checkIn1,
      checkOut: checkOut1,
      nights: 3,
      guests: 2,
      basePrice: 300,
      cleaningFee: 30,
      serviceFee: 42,
      taxes: 0,
      total: 372,
      status: 'cancelled' // This booking is cancelled
    });
    
    await cancelledBooking.save();
    console.log('Created cancelled booking:', cancelledBooking._id);
    
    // Test 2: Try to create a new booking for the same dates (should succeed since the first booking is cancelled)
    const isAvailable = await Booking.checkAvailability(listing._id, checkIn1, checkOut1);
    console.log('Booking availability with cancelled booking:', isAvailable ? '✅ Available' : '❌ Not available (unexpected!)');
    
    if (isAvailable) {
      console.log('✅ Cancelled booking correctly does not block new bookings');
      
      // Test 3: Actually create the new booking
      const newBooking = new Booking({
        listing: listing._id,
        guest: user._id,
        host: user._id,
        checkIn: checkIn1,
        checkOut: checkOut1,
        nights: 3,
        guests: 2,
        basePrice: 300,
        cleaningFee: 30,
        serviceFee: 42,
        taxes: 0,
        total: 372,
        status: 'pending'
      });
      
      try {
        await newBooking.save();
        console.log('✅ New booking successfully created for dates previously occupied by cancelled booking');
        
        // Clean up
        await Booking.deleteMany({ 
          listing: listing._id,
          guest: user._id 
        });
      } catch (error) {
        console.error('❌ Failed to create new booking:', error.message);
      }
    } else {
      console.log('❌ ERROR: Cancelled booking is blocking new bookings!');
    }
    
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });