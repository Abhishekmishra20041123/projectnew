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
        title: 'Test Listing for Overlapping Bookings',
        description: 'Test listing for overlapping booking scenarios',
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
    
    // Clear any existing test bookings for this listing
    await Booking.deleteMany({ listing: listing._id });
    console.log('Cleared existing bookings for test listing');
    
    // Test 1: Create a base booking
    const checkIn1 = new Date();
    checkIn1.setDate(checkIn1.getDate() + 5);
    
    const checkOut1 = new Date(checkIn1);
    checkOut1.setDate(checkOut1.getDate() + 3);
    
    const booking1 = new Booking({
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
      status: 'confirmed'
    });
    
    await booking1.save();
    console.log('Created base booking:', booking1._id);
    
    // Test 2: Try to create an overlapping booking (should fail)
    const checkIn2 = new Date(checkIn1);
    checkIn2.setDate(checkIn2.getDate() + 1); // Overlaps with booking1
    
    const checkOut2 = new Date(checkIn2);
    checkOut2.setDate(checkOut2.getDate() + 3);
    
    const isAvailable = await Booking.checkAvailability(listing._id, checkIn2, checkOut2);
    console.log('Overlapping booking availability:', isAvailable ? '✅ Available (unexpected!)' : '❌ Not available (correct)');
    
    if (!isAvailable) {
      console.log('✅ Overlapping booking correctly blocked');
    } else {
      console.log('❌ ERROR: Overlapping booking was not blocked!');
    }
    
    // Test 3: Try to create a non-overlapping booking (should succeed)
    const checkIn3 = new Date(checkOut1);
    checkIn3.setDate(checkIn3.getDate() + 2); // No overlap with booking1
    
    const checkOut3 = new Date(checkIn3);
    checkOut3.setDate(checkOut3.getDate() + 2);
    
    const isAvailable2 = await Booking.checkAvailability(listing._id, checkIn3, checkOut3);
    console.log('Non-overlapping booking availability:', isAvailable2 ? '✅ Available (correct)' : '❌ Not available (unexpected!)');
    
    if (isAvailable2) {
      console.log('✅ Non-overlapping booking correctly allowed');
      
      // Actually create the booking
      const booking3 = new Booking({
        listing: listing._id,
        guest: user._id,
        host: user._id,
        checkIn: checkIn3,
        checkOut: checkOut3,
        nights: 2,
        guests: 2,
        basePrice: 200,
        cleaningFee: 20,
        serviceFee: 28,
        taxes: 0,
        total: 248,
        status: 'confirmed'
      });
      
      try {
        await booking3.save();
        console.log('✅ Non-overlapping booking successfully created');
      } catch (error) {
        console.error('❌ Failed to create non-overlapping booking:', error.message);
      }
    } else {
      console.log('❌ ERROR: Non-overlapping booking was blocked!');
    }
    
    // Test 4: Try to create a booking that ends when another begins (should succeed)
    const checkIn4 = new Date(checkOut1);
    const checkOut4 = new Date(checkOut1);
    checkOut4.setDate(checkOut4.getDate() + 2);
    
    const isAvailable3 = await Booking.checkAvailability(listing._id, checkIn4, checkOut4);
    console.log('Booking that ends when another begins:', isAvailable3 ? '✅ Available (correct)' : '❌ Not available (unexpected!)');
    
    // Clean up
    await Booking.deleteMany({ listing: listing._id });
    console.log('✅ Test completed and cleaned up');
    process.exit(0);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });