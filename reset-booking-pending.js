const mongoose = require('mongoose');
const Booking = require('./models/booking.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Reset the test booking status to pending
    const booking = await Booking.findById('68b35fe315cc461e9aa9d507');
    
    if (!booking) {
      console.log('Test booking not found');
      process.exit(0);
    }
    
    console.log('Found booking:', booking._id, 'with current status:', booking.status);
    
    // Reset the booking status
    booking.status = 'pending';
    booking.cancelledAt = null;
    booking.cancelledBy = null;
    booking.respondedAt = null;
    await booking.save();
    
    console.log('Booking status reset to pending');
    console.log('New status:', booking.status);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });