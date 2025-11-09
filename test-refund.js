const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const Payment = require('./models/payment.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find a paid booking to test refund
    const booking = await Booking.findById('68b35fe315cc461e9aa9d507')
      .populate('payment');
    
    if (!booking) {
      console.log('Test booking not found');
      process.exit(0);
    }
    
    console.log('Found booking:', booking._id);
    console.log('Booking total:', booking.total);
    console.log('Payment ID:', booking.paymentId);
    console.log('Payment status:', booking.paymentStatus);
    
    if (booking.payment) {
      console.log('Payment object found:', booking.payment._id);
      console.log('Payment amount:', booking.payment.amount);
      console.log('Payment status:', booking.payment.status);
    }
    
    // Test refund calculation
    const now = new Date();
    const checkIn = new Date(booking.checkIn);
    const daysUntilCheckIn = Math.ceil((checkIn - now) / (1000 * 60 * 60 * 24));
    
    console.log('Days until check-in:', daysUntilCheckIn);
    
    let refundPercentage = 0;
    let refundAmount = 0;
    let refundReason = '';
    
    if (daysUntilCheckIn > 7) {
      refundPercentage = 100;
      refundAmount = booking.total;
      refundReason = 'Full refund (more than 7 days before check-in)';
    } else if (daysUntilCheckIn > 3) {
      refundPercentage = 50;
      refundAmount = booking.total * 0.5;
      refundReason = '50% refund (3-7 days before check-in)';
    } else if (daysUntilCheckIn > 1) {
      refundPercentage = 25;
      refundAmount = booking.total * 0.25;
      refundReason = '25% refund (1-3 days before check-in)';
    } else {
      refundPercentage = 0;
      refundAmount = 0;
      refundReason = 'No refund (less than 24 hours before check-in)';
    }
    
    console.log('Refund percentage:', refundPercentage + '%');
    console.log('Refund amount:', refundAmount);
    console.log('Refund reason:', refundReason);
    
    // Test actual refund process
    if (refundAmount > 0 && booking.payment) {
      const payment = await Payment.findById(booking.payment._id);
      if (payment && payment.status === 'succeeded') {
        // Update payment with refund information
        payment.status = 'refunded';
        payment.refund = {
          amount: refundAmount,
          reason: refundReason,
          refundedAt: new Date(),
          refundId: 'REF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        };
        await payment.save();
        
        console.log('✅ Refund processed successfully!');
        console.log('Refund ID:', payment.refund.refundId);
        console.log('Refund processed at:', payment.refund.refundedAt);
        
        // Update booking status
        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        await booking.save();
        
        console.log('✅ Booking status updated to cancelled');
      }
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });