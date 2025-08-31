// Test timezone issues that might affect date parsing

console.log('Current timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Current date:', new Date());

// Test how dates are handled in different timezones
const testDateStr = '2025-09-01';
console.log('\nTesting date string:', testDateStr);

const dateUTC = new Date(testDateStr + 'T00:00:00Z');
const dateLocal = new Date(testDateStr);

console.log('Date with UTC timezone (Z):', dateUTC);
console.log('Date without timezone (local):', dateLocal);

// Check if they're the same day
console.log('UTC date in local timezone:', dateUTC.toLocaleDateString());
console.log('Local date:', dateLocal.toLocaleDateString());

// Test the availability check with both formats
const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const Listing = require('./models/listing.js');

mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('\n--- Testing availability with different date formats ---');
    
    // Find any listing
    const listing = await Listing.findOne();
    if (!listing) {
      console.log('No listings found');
      process.exit(1);
    }
    
    console.log('Using listing:', listing.title);
    
    // Test with UTC date
    console.log('\nTesting with UTC date:', dateUTC);
    const isAvailableUTC = await Booking.checkAvailability(listing._id, dateUTC, new Date('2025-09-02T00:00:00Z'));
    console.log('Availability with UTC dates:', isAvailableUTC ? 'Available' : 'Not available');
    
    // Test with local date
    console.log('\nTesting with local date:', dateLocal);
    const isAvailableLocal = await Booking.checkAvailability(listing._id, dateLocal, new Date('2025-09-02'));
    console.log('Availability with local dates:', isAvailableLocal ? 'Available' : 'Not available');
    
    // If not available, check what's blocking it
    if (!isAvailableLocal) {
      console.log('\nInvestigating what\'s blocking the local date booking...');
      
      const blocking = await Booking.find({
        listing: listing._id,
        status: { $nin: ['cancelled'] },
        $or: [
          {
            checkIn: { $lt: new Date('2025-09-02') },
            checkOut: { $gt: dateLocal }
          }
        ]
      });
      
      console.log(`Found ${blocking.length} blocking booking(s):`);
      blocking.forEach(b => {
        console.log(`  - ${b.checkIn.toISOString().split('T')[0]} to ${b.checkOut.toISOString().split('T')[0]} (Status: ${b.status})`);
      });
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });