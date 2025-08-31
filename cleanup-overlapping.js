const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const Listing = require('./models/listing.js');

// Use the same connection logic as the main app
const connectDB = require('./config/database.js');

// Connect to database
connectDB().then(async () => {
    console.log('Connected to MongoDB');
    
    // Find all listings that have bookings
    const listingsWithBookings = await Booking.distinct('listing');
    console.log(`Found ${listingsWithBookings.length} listings with bookings`);
    
    let totalConflicts = 0;
    
    // Check each listing for overlapping bookings
    for (const listingId of listingsWithBookings) {
      // Get all non-cancelled bookings for this listing, sorted by check-in date
      const bookings = await Booking.find({
        listing: listingId,
        status: { $ne: 'cancelled' }
      }).sort({ checkIn: 1 });
      
      if (bookings.length <= 1) continue; // No conflicts possible with 0 or 1 booking
      
      console.log(`\nChecking listing ${listingId} (${bookings.length} bookings)`);
      
      // Check for overlapping bookings
      for (let i = 0; i < bookings.length - 1; i++) {
        const currentBooking = bookings[i];
        const nextBooking = bookings[i + 1];
        
        // If current booking's check-out is after next booking's check-in, there's overlap
        if (currentBooking.checkOut > nextBooking.checkIn) {
          totalConflicts++;
          console.log(`  ❌ Conflict found:`);
          console.log(`     Booking ${currentBooking._id}: ${currentBooking.checkIn.toISOString().split('T')[0]} to ${currentBooking.checkOut.toISOString().split('T')[0]}`);
          console.log(`     Booking ${nextBooking._id}: ${nextBooking.checkIn.toISOString().split('T')[0]} to ${nextBooking.checkOut.toISOString().split('T')[0]}`);
          
          // Cancel the later booking (nextBooking) to preserve the earlier one
          nextBooking.status = 'cancelled';
          nextBooking.cancelledAt = new Date();
          nextBooking.cancellationReason = 'Overlapping booking - automatically cancelled';
          await nextBooking.save();
          
          console.log(`     ✅ Cancelled booking ${nextBooking._id} to resolve conflict`);
        }
      }
    }
    
    console.log(`\n✅ Cleanup complete. Found and resolved ${totalConflicts} overlapping bookings.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });