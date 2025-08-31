// Load environment variables first
if(process.env.NODE_ENV != "production"){
    require("dotenv").config({quiet:true});
}

const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const Listing = require('./models/listing.js');

// Use the same connection logic as the main app
const connectDB = require('./config/database.js');

// Connect to database
connectDB().then(async () => {
    console.log('Connected to MongoDB');
    
    // Find any listing
    const listing = await Listing.findOne();
    if (!listing) {
      console.log('No listings found');
      process.exit(1);
    }
    
    console.log('Using listing:', listing.title);
    console.log('Listing ID:', listing._id);
    
    // Simulate the exact booking request for September 1-2, 2025
    const checkInString = '2025-09-01';
    const checkOutString = '2025-09-02';
    const guests = '1';
    
    console.log(`\nSimulating booking request:`);
    console.log(`  Check-in: ${checkInString}`);
    console.log(`  Check-out: ${checkOutString}`);
    console.log(`  Guests: ${guests}`);
    
    // Parse dates the same way the routes do
    const checkInDate = new Date(checkInString);
    const checkOutDate = new Date(checkOutString);
    
    console.log(`\nParsed dates:`);
    console.log(`  Check-in: ${checkInDate.toISOString()} (${checkInDate.toDateString()})`);
    console.log(`  Check-out: ${checkOutDate.toISOString()} (${checkOutDate.toDateString()})`);
    
    // Validate dates (same as routes)
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
    
    // Calculate nights (same as routes)
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    console.log(`\nNights: ${nights}`);
    
    // Check availability (same as routes)
    console.log(`\nChecking availability...`);
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
      
      process.exit(1);
    } else {
      console.log('✅ Availability check passed');
    }
    
    // If we get here, the booking should be possible
    console.log(`\n✅ Booking should be possible for these dates!`);
    console.log(`If you're still having issues booking through the web interface, there might be:`);
    console.log(`  1. A frontend JavaScript error`);
    console.log(`  2. A session or authentication issue`);
    console.log(`  3. A caching issue with the browser`);
    console.log(`  4. A timezone issue with date parsing`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });