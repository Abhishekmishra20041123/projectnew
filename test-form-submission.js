const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const Listing = require('./models/listing.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find any listing
    const listing = await Listing.findOne();
    if (!listing) {
      console.log('No listings found');
      process.exit(1);
    }
    
    console.log('Using listing:', listing.title);
    console.log('Listing ID:', listing._id);
    
    // Simulate form submission with the exact dates you're trying to book
    const formData = {
      checkIn: '2025-09-01',
      checkOut: '2025-09-02',
      guests: '1'
    };
    
    console.log(`\nSimulating form submission:`);
    console.log(`  Form data:`, formData);
    
    // Parse dates the same way the routes do
    let checkInDate, checkOutDate;
    try {
      checkInDate = new Date(formData.checkIn);
      checkOutDate = new Date(formData.checkOut);
      
      console.log(`\nParsed dates:`);
      console.log(`  Check-in: ${checkInDate.toISOString()} (${checkInDate.toDateString()})`);
      console.log(`  Check-out: ${checkOutDate.toISOString()} (${checkOutDate.toDateString()})`);
      
      // Check if dates are valid
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        console.log('❌ ERROR: Invalid date format');
        process.exit(1);
      }
    } catch (error) {
      console.log('❌ ERROR: Invalid date format');
      process.exit(1);
    }
    
    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate < today) {
      console.log('❌ ERROR: Check-in date cannot be in the past!');
      process.exit(1);
    }
    
    if (checkOutDate <= checkInDate) {
      console.log('❌ ERROR: Check-out date must be after check-in date!');
      process.exit(1);
    }
    
    // Calculate nights
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    console.log(`\nNights: ${nights}`);
    
    // Check availability using the model's static method
    console.log(`\nChecking availability using model method...`);
    const isAvailable = await Booking.checkAvailability(listing._id, checkInDate, checkOutDate);
    
    if (!isAvailable) {
      console.log('❌ ERROR: Sorry, this listing is not available for the selected dates. Please choose different dates.');
      
      // Investigate what's blocking it
      console.log(`\nInvestigating blocking bookings...`);
      
      // Check all bookings overlapping with these dates
      const allOverlapping = await Booking.find({
        listing: listing._id,
        $or: [
          {
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate }
          }
        ]
      }).sort({ checkIn: 1 });
      
      console.log(`Found ${allOverlapping.length} overlapping booking(s):`);
      allOverlapping.forEach(booking => {
        console.log(`  - ID: ${booking._id}`);
        console.log(`    Dates: ${booking.checkIn.toISOString().split('T')[0]} to ${booking.checkOut.toISOString().split('T')[0]}`);
        console.log(`    Status: ${booking.status}`);
        console.log(`    Guest: ${booking.guest}`);
      });
      
      // Check only active bookings (not cancelled or declined)
      const activeOverlapping = await Booking.find({
        listing: listing._id,
        status: { $nin: ['cancelled', 'declined'] },
        $or: [
          {
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate }
          }
        ]
      }).sort({ checkIn: 1 });
      
      console.log(`\nActive (non-cancelled) overlapping booking(s): ${activeOverlapping.length}`);
      if (activeOverlapping.length > 0) {
        activeOverlapping.forEach(booking => {
          console.log(`  - ID: ${booking._id}`);
          console.log(`    Dates: ${booking.checkIn.toISOString().split('T')[0]} to ${booking.checkOut.toISOString().split('T')[0]}`);
          console.log(`    Status: ${booking.status}`);
        });
      } else {
        console.log(`  None - This means cancelled bookings might be incorrectly blocking availability`);
      }
    } else {
      console.log('✅ Availability check passed');
      console.log('✅ Booking should be possible for these dates!');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });