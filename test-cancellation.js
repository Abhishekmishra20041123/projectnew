const mongoose = require('mongoose');
const Booking = require('./models/booking.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find the test booking we just created
    const booking = await Booking.findById('68b35fa0bc54fb8dcc384865');
    
    if (!booking) {
      console.log('Test booking not found');
      process.exit(0);
    }
    
    console.log('Found booking:', booking._id, 'with status:', booking.status);
    
    // Test the cancellation logic directly
    try {
      // Check if booking is already cancelled
      if (booking.status === 'cancelled') {
        console.log('This booking has already been cancelled.');
        process.exit(0);
      }
      
      // Check if check-in date is in the past
      if (new Date(booking.checkIn) <= new Date()) {
        console.log('Cannot cancel a booking with a check-in date in the past.');
        process.exit(0);
      }
      
      // Update booking status
      booking.status = 'cancelled';
      booking.cancelledAt = new Date();
      // booking.cancelledBy = req.user._id; // We don't have user context in this test
      await booking.save();
      
      console.log(`Booking ${booking._id} cancelled successfully!`);
      console.log('New status:', booking.status);
      
      process.exit(0);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });