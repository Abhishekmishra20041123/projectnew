const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const User = require('./models/user.js');
const Listing = require('./models/listing.js');

// Use the same connection logic as the main app
const connectDB = require('./config/database.js');

// Connect to database
connectDB().then(async () => {
    console.log('Connected to MongoDB');
    
    // Find Palm Island listing
    const listing = await Listing.findOne({ 
      title: { $regex: /palm island/i } 
    });
    
    if (!listing) {
      console.log('Palm Island listing not found. Looking for any listing...');
      const anyListing = await Listing.findOne();
      if (!anyListing) {
        console.log('No listings found in database');
        process.exit(1);
      }
      console.log('Using listing:', anyListing.title);
    } else {
      console.log('Found Palm Island listing:', listing.title);
    }
    
    const targetListing = listing || await Listing.findOne();
    
    // Check availability for September 1-2, 2025
    const checkInDate = new Date('2025-09-01');
    const checkOutDate = new Date('2025-09-02');
    
    console.log(`\nChecking availability for ${checkInDate.toISOString().split('T')[0]} to ${checkOutDate.toISOString().split('T')[0]}`);
    
    // Check what bookings exist for this listing in that date range
    const allBookings = await Booking.find({
      listing: targetListing._id,
      $or: [
        {
          checkIn: { $lt: checkOutDate },
          checkOut: { $gt: checkInDate }
        }
      ]
    }).sort({ checkIn: 1 });
    
    console.log(`\nFound ${allBookings.length} booking(s) overlapping with these dates:`);
    allBookings.forEach(booking => {
      console.log(`  - ${booking._id}: ${booking.checkIn.toISOString().split('T')[0]} to ${booking.checkOut.toISOString().split('T')[0]} (Status: ${booking.status})`);
    });
    
    // Check availability using our method
    const isAvailable = await Booking.checkAvailability(targetListing._id, checkInDate, checkOutDate);
    
    console.log(`\nAvailability check result: ${isAvailable ? '✅ Available' : '❌ Not available'}`);
    
    if (!isAvailable) {
      // Let's check what's blocking it
      const activeBookings = await Booking.find({
        listing: targetListing._id,
        status: { $nin: ['cancelled'] },
        $or: [
          {
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate }
          }
        ]
      }).sort({ checkIn: 1 });
      
      console.log(`\nActive bookings (excluding cancelled) blocking this date:`);
      activeBookings.forEach(booking => {
        console.log(`  - ${booking._id}: ${booking.checkIn.toISOString().split('T')[0]} to ${booking.checkOut.toISOString().split('T')[0]} (Status: ${booking.status})`);
      });
      
      if (activeBookings.length === 0) {
        console.log('  None - This suggests there might be an issue with the availability check logic');
      }
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });