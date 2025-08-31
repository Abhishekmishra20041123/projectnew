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
    
    // Test the exact dates you mentioned: September 1-2, 2025
    const checkInString = '2025-09-01';
    const checkOutString = '2025-09-02';
    
    console.log(`\nTesting dates: ${checkInString} to ${checkOutString}`);
    
    // Parse dates the same way the controller does
    const checkInDate = new Date(checkInString);
    const checkOutDate = new Date(checkOutString);
    
    console.log(`Parsed dates:`);
    console.log(`  Check-in: ${checkInDate.toISOString()} (${checkInDate.toDateString()})`);
    console.log(`  Check-out: ${checkOutDate.toISOString()} (${checkOutDate.toDateString()})`);
    
    // Validate date logic (same as controller)
    if (checkOutDate <= checkInDate) {
      console.log('❌ ERROR: Check-out date must be after check-in date');
      process.exit(1);
    }
    
    // Check availability using the model's static method
    console.log(`\nChecking availability using model method...`);
    const isAvailable = await Booking.checkAvailability(listing._id, checkInDate, checkOutDate);
    console.log(`Availability result: ${isAvailable ? '✅ Available' : '❌ Not available'}`);
    
    // If not available, let's see what's blocking it
    if (!isAvailable) {
      console.log(`\nInvestigating what's blocking the booking...`);
      
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
    }
    
    // Let's also test the direct database query that the model uses
    console.log(`\nTesting direct database query...`);
    const conflictingBookings = await Booking.find({
      listing: listing._id,
      status: { $nin: ['cancelled', 'declined'] },
      $or: [
        {
          checkIn: { $lt: checkOutDate },
          checkOut: { $gt: checkInDate }
        }
      ]
    });
    
    console.log(`Direct query found ${conflictingBookings.length} conflicting booking(s)`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });