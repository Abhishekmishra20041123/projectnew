const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const Listing = require('./models/listing.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find Palm Island listing specifically
    const listing = await Listing.findOne({ 
      title: { $regex: /palm island/i } 
    });
    
    if (!listing) {
      console.log('Palm Island listing not found. Checking all listings...');
      const allListings = await Listing.find();
      console.log(`Found ${allListings.length} total listings:`);
      allListings.forEach(l => console.log(`  - ${l.title}`));
      process.exit(1);
    }
    
    console.log('Found Palm Island listing:', listing.title);
    console.log('Listing ID:', listing._id);
    
    // Check for bookings on September 1-2, 2025
    const checkInDate = new Date('2025-09-01');
    const checkOutDate = new Date('2025-09-02');
    
    console.log(`\nChecking for bookings from ${checkInDate.toISOString().split('T')[0]} to ${checkOutDate.toISOString().split('T')[0]}`);
    
    // Check all bookings for this listing in that date range
    const allBookings = await Booking.find({
      listing: listing._id,
      $or: [
        {
          checkIn: { $lt: checkOutDate },
          checkOut: { $gt: checkInDate }
        }
      ]
    }).sort({ checkIn: 1 });
    
    console.log(`\nFound ${allBookings.length} booking(s) overlapping with these dates:`);
    if (allBookings.length > 0) {
      allBookings.forEach(booking => {
        console.log(`  - Booking ID: ${booking._id}`);
        console.log(`    Guest: ${booking.guest}`);
        console.log(`    Dates: ${booking.checkIn.toISOString().split('T')[0]} to ${booking.checkOut.toISOString().split('T')[0]}`);
        console.log(`    Status: ${booking.status}`);
        console.log(`    Total: ₹${booking.total}`);
        console.log(`    ---`);
      });
    }
    
    // Check specifically for active (non-cancelled) bookings
    const activeBookings = await Booking.find({
      listing: listing._id,
      status: { $nin: ['cancelled'] },
      $or: [
        {
          checkIn: { $lt: checkOutDate },
          checkOut: { $gt: checkInDate }
        }
      ]
    }).sort({ checkIn: 1 });
    
    console.log(`\nActive bookings (excluding cancelled): ${activeBookings.length}`);
    if (activeBookings.length > 0) {
      activeBookings.forEach(booking => {
        console.log(`  - Booking ID: ${booking._id}`);
        console.log(`    Guest: ${booking.guest}`);
        console.log(`    Dates: ${booking.checkIn.toISOString().split('T')[0]} to ${booking.checkOut.toISOString().split('T')[0]}`);
        console.log(`    Status: ${booking.status}`);
        console.log(`    ---`);
      });
      console.log('\n❌ These active bookings would prevent a new booking for the same dates.');
    } else {
      console.log('\n✅ No active bookings found. These dates should be available for booking.');
    }
    
    // Check availability using the model method
    console.log(`\nChecking availability using model method...`);
    const isAvailable = await Booking.checkAvailability(listing._id, checkInDate, checkOutDate);
    console.log(`Availability result: ${isAvailable ? '✅ Available' : '❌ Not available'}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });