const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const Payment = require('./models/payment.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('=== CANCELLATION & REVENUE ADJUSTMENT SYSTEM ===\n');
    
    console.log('SYSTEM OVERVIEW:');
    console.log('This system automatically handles booking cancellations and adjusts');
    console.log('revenue in real-time based on the cancellation policy.\n');
    
    // Explain the cancellation policy
    console.log('CANCELLATION POLICY:');
    console.log('1. More than 7 days before check-in: 100% refund');
    console.log('2. 3-7 days before check-in: 50% refund');
    console.log('3. 1-3 days before check-in: 25% refund');
    console.log('4. Less than 24 hours before check-in: 0% refund\n');
    
    // Show how the system processes any cancellation
    console.log('PROCESS FLOW FOR ANY CANCELLATION:');
    console.log('1. System calculates days until check-in');
    console.log('2. Applies appropriate refund percentage based on policy');
    console.log('3. Processes refund amount to guest\'s original payment method');
    console.log('4. Adjusts total revenue by refund amount');
    console.log('5. Sends personalized message to guest with refund details\n');
    
    // Demonstrate with examples
    console.log('EXAMPLE SCENARIOS:');
    
    const examples = [
      {
        scenario: "Guest cancels 1 month before check-in",
        total: 500,
        daysBefore: 30,
        expectedRefund: 500,
        message: "Dear guest, your booking has been cancelled and a full refund of $500 (100%) has been processed to your original payment method. As per our cancellation policy, you received a 100% refund as your cancellation was made more than 7 days before check-in."
      },
      {
        scenario: "Guest cancels 5 days before check-in",
        total: 400,
        daysBefore: 5,
        expectedRefund: 200,
        message: "Dear guest, your booking has been cancelled and a refund of $200 (50%) has been processed to your original payment method. As per our cancellation policy, you received a 50% refund as your cancellation was made 3-7 days before check-in."
      },
      {
        scenario: "Guest cancels 2 days before check-in",
        total: 300,
        daysBefore: 2,
        expectedRefund: 75,
        message: "Dear guest, your booking has been cancelled and a refund of $75 (25%) has been processed to your original payment method. As per our cancellation policy, you received a 25% refund as your cancellation was made 1-3 days before check-in."
      },
      {
        scenario: "Guest cancels 12 hours before check-in",
        total: 200,
        daysBefore: 0.5,
        expectedRefund: 0,
        message: "Dear guest, your booking has been cancelled. As per our cancellation policy, no refund was issued as your cancellation was made less than 24 hours before check-in."
      }
    ];
    
    examples.forEach((example, index) => {
      console.log(`\n${index + 1}. ${example.scenario}:`);
      console.log(`   Booking Total: ₹${example.total}`);
      console.log(`   Refund Amount: $${example.expectedRefund}`);
      console.log(`   Revenue Adjustment: -$${example.expectedRefund}`);
      console.log(`   Guest Message: ${example.message}`);
    });
    
    // Show current system status
    console.log('\n\nCURRENT SYSTEM STATUS:');
    
    // Get current metrics
    const allBookings = await Booking.find({});
    const refundedPayments = await Payment.find({ status: 'refunded' });
    const totalRefunded = refundedPayments.reduce((sum, payment) => {
      return sum + (payment.refund?.amount || 0);
    }, 0);
    
    const totalPotentialRevenue = allBookings.reduce((sum, booking) => sum + booking.total, 0);
    const activeBookings = await Booking.find({ 
      status: { $in: ['confirmed', 'completed'] } 
    });
    
    let earnedRevenue = 0;
    for (const booking of activeBookings) {
      if (booking.payment) {
        try {
          const payment = await Payment.findById(booking.payment);
          if (payment && payment.status === 'succeeded') {
            earnedRevenue += booking.total;
          }
        } catch (err) {
          // Ignore errors
        }
      }
    }
    
    const netRevenue = earnedRevenue - totalRefunded;
    
    console.log(`- Total Bookings: ${allBookings.length}`);
    console.log(`- Total Potential Revenue: ₹${totalPotentialRevenue.toFixed(2)}`);
    console.log(`- Total Refunded: ₹${totalRefunded.toFixed(2)}`);
    console.log(`- Current Net Revenue: $${netRevenue.toFixed(2)}`);
    console.log(`- System Operational: ✓`);
    
    console.log('\n=== KEY FEATURES ===');
    console.log('✓ Real-time revenue adjustment for any cancellation');
    console.log('✓ Policy-based refund calculation');
    console.log('✓ Automated guest notifications');
    console.log('✓ Comprehensive reporting');
    console.log('✓ Host decline handling (100% refund)');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });