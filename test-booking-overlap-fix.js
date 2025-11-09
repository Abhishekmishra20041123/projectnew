const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const User = require('./models/user.js');
const Listing = require('./models/listing.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
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
        title: 'Test Listing',
        description: 'Test listing for booking overlap testing',
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
    
    // Test 1: Create a booking
    const checkIn1 = new Date();
    checkIn1.setDate(checkIn1.getDate() + 10);
    
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
    console.log('Created first booking:', booking1._id);
    
    // Test 2: Try to create an overlapping booking (should fail)
    const checkIn2 = new Date(checkIn1);
    checkIn2.setDate(checkIn2.getDate() + 1); // Overlaps with booking1
    
    const checkOut2 = new Date(checkIn2);
    checkOut2.setDate(checkOut2.getDate() + 2);
    
    const isAvailable = await Booking.checkAvailability(listing._id, checkIn2, checkOut2);
    console.log('Overlapping booking availability check:', isAvailable ? '✅ Available (unexpected!)' : '❌ Correctly blocked');
    
    if (!isAvailable) {
      console.log('✅ Overlapping booking correctly prevented');
    } else {
      console.log('❌ ERROR: Overlapping booking was allowed!');
    }
    
    // Test 3: Try to create a non-overlapping booking (should succeed)
    const checkIn3 = new Date(checkOut1);
    checkIn3.setDate(checkIn3.getDate() + 2); // No overlap
    
    const checkOut3 = new Date(checkIn3);
    checkOut3.setDate(checkOut3.getDate() + 2);
    
    const isAvailable2 = await Booking.checkAvailability(listing._id, checkIn3, checkOut3);
    console.log('Non-overlapping booking availability check:', isAvailable2 ? '✅ Available' : '❌ Not available (unexpected!)');
    
    if (isAvailable2) {
      console.log('✅ Non-overlapping booking correctly allowed');
    } else {
      console.log('❌ ERROR: Non-overlapping booking was blocked!');
    }
    
    // Clean up test bookings
    await Booking.deleteMany({ 
      listing: listing._id,
      guest: user._id 
    });
    
    console.log('✅ Test completed and cleaned up');
    process.exit(0);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });