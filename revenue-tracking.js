const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const Payment = require('./models/payment.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Calculate total revenue from all bookings
    const allBookings = await Booking.find({});
    const totalPotentialRevenue = allBookings.reduce((sum, booking) => sum + booking.total, 0);
    
    console.log(`Total potential revenue: ₹${totalPotentialRevenue.toFixed(2)}`);
    
    // Calculate actual revenue (only from bookings that are confirmed or completed)
    const activeBookings = await Booking.find({ 
      status: { $in: ['confirmed', 'completed'] } 
    });
    const actualRevenue = activeBookings.reduce((sum, booking) => sum + booking.total, 0);
    
    console.log(`Actual revenue (confirmed/completed bookings): ₹${actualRevenue.toFixed(2)}`);
    
    // Calculate refunded amounts from payments
    const refundedPayments = await Payment.find({ status: 'refunded' });
    const totalRefunded = refundedPayments.reduce((sum, payment) => {
      return sum + (payment.refund?.amount || 0);
    }, 0);
    
    console.log(`Total refunded: ₹${totalRefunded.toFixed(2)}`);
    
    // Calculate adjusted revenue (actual revenue minus refunded amounts)
    const adjustedRevenue = actualRevenue - totalRefunded;
    
    console.log(`\n=== REVENUE SUMMARY ===`);
    console.log(`Total potential revenue: ₹${totalPotentialRevenue.toFixed(2)}`);
    console.log(`Actual revenue: ₹${actualRevenue.toFixed(2)}`);
    console.log(`Total refunded: ₹${totalRefunded.toFixed(2)}`);
    console.log(`Adjusted revenue: ₹${adjustedRevenue.toFixed(2)}`);
    
    // Show details of refunded bookings
    console.log(`\n=== REFUNDED BOOKINGS ===`);
    for (const payment of refundedPayments) {
      const booking = await Booking.findOne({ payment: payment._id });
      if (booking) {
        console.log(`\nBooking ID: ${booking._id}`);
        console.log(`  Guest: ${booking.guest}`); // In a real app, this would be populated with guest details
        console.log(`  Amount: ₹${booking.total}`);
        console.log(`  Status: ${booking.status}`);
        console.log(`  Refund amount: ₹${payment.refund.amount}`);
        console.log(`  Refund reason: ${payment.refund.reason}`);
        console.log(`  Refunded at: ${payment.refund.refundedAt}`);
        
        // This is where you would send a message to the guest about their refund
        console.log(`  MESSAGE TO GUEST: Dear guest, your booking has been ${booking.status} and a refund of ₹${payment.refund.amount} has been processed to your original payment method. ${getRefundPolicyMessage(booking.status, payment.refund.reason)}.`);
      }
    }
    
    // Show details of cancelled bookings (might not have payments if cancelled before payment)
    console.log(`\n=== CANCELLED BOOKINGS ===`);
    const cancelledBookings = await Booking.find({ status: 'cancelled' });
    for (const booking of cancelledBookings) {
      console.log(`\nBooking ID: ${booking._id}`);
      console.log(`  Guest: ${booking.guest}`);
      console.log(`  Amount: ₹${booking.total}`);
      console.log(`  Status: ${booking.status}`);
      
      if (booking.payment) {
        const payment = await Payment.findById(booking.payment);
        if (payment && payment.status === 'refunded' && payment.refund) {
          console.log(`  Refund amount: ₹${payment.refund.amount}`);
          console.log(`  Refund reason: ${payment.refund.reason}`);
          console.log(`  Refunded at: ${payment.refund.refundedAt}`);
          
          console.log(`  MESSAGE TO GUEST: Dear guest, your booking has been ${booking.status} and a refund of ₹${payment.refund.amount} has been processed to your original payment method. ${getRefundPolicyMessage(booking.status, payment.refund.reason)}.`);
        } else {
          console.log(`  No refund processed for this booking.`);
          console.log(`  MESSAGE TO GUEST: Dear guest, your booking has been ${booking.status}. No payment was processed for this booking.`);
        }
      } else {
        console.log(`  No payment was required for this booking.`);
        console.log(`  MESSAGE TO GUEST: Dear guest, your booking has been ${booking.status}. No payment was processed for this booking.`);
      }
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });

// Function to generate appropriate messages based on cancellation policy
function getRefundPolicyMessage(bookingStatus, refundReason) {
  if (bookingStatus === 'declined') {
    return 'As per our policy, when a host declines a booking, guests receive a 100% refund';
  } else if (bookingStatus === 'cancelled') {
    // In a real implementation, you would check the cancellation timing to determine the refund percentage
    if (refundReason.includes('Full refund')) {
      return 'As per our cancellation policy, you received a 100% refund as your cancellation was made more than 7 days before check-in';
    } else if (refundReason.includes('50% refund')) {
      return 'As per our cancellation policy, you received a 50% refund as your cancellation was made 3-7 days before check-in';
    } else if (refundReason.includes('25% refund')) {
      return 'As per our cancellation policy, you received a 25% refund as your cancellation was made 1-3 days before check-in';
    } else {
      return 'As per our cancellation policy, no refund was issued as your cancellation was made less than 24 hours before check-in';
    }
  }
  return 'Thank you for using our service';
}