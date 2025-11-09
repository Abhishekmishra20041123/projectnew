const mongoose = require('mongoose');
const Booking = require('./models/booking.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find all bookings and their statuses
    const bookings = await Booking.find({}).select('status total cancelledAt createdAt');
    
    console.log(`Total bookings: ${bookings.length}`);
    
    // Group by status
    const statusGroups = {};
    bookings.forEach(booking => {
      if (!statusGroups[booking.status]) {
        statusGroups[booking.status] = [];
      }
      statusGroups[booking.status].push(booking);
    });
    
    // Display counts by status
    Object.keys(statusGroups).forEach(status => {
      console.log(`${status}: ${statusGroups[status].length} bookings`);
    });
    
    // Show cancelled bookings with details
    if (statusGroups['cancelled']) {
      console.log('\nCancelled bookings:');
      statusGroups['cancelled'].forEach(booking => {
        console.log(`  - ID: ${booking._id}`);
        console.log(`    Total: ₹${booking.total}`);
        console.log(`    Created: ${booking.createdAt}`);
        console.log(`    Cancelled: ${booking.cancelledAt}`);
        console.log(`    Days since cancellation: ${Math.ceil((new Date() - new Date(booking.cancelledAt)) / (1000 * 60 * 60 * 24))}`);
        console.log('');
      });
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });