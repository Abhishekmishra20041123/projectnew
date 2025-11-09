const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const Payment = require('./models/payment.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    console.log('=== REVENUE ADJUSTMENT SYSTEM ===\n');
    
    // Process all cancelled and declined bookings to ensure proper refunds and messaging
    const bookings = await Booking.find({ 
      status: { $in: ['cancelled', 'declined'] } 
    });
    
    console.log(`Found ${bookings.length} bookings to process for revenue adjustment`);
    
    let totalRefunded = 0;
    let messagesSent = 0;
    
    for (const booking of bookings) {
      console.log(`\nProcessing booking ${booking._id} (status: ${booking.status})`);
      
      // Populate payment if it exists
      let payment = null;
      if (booking.payment) {
        try {
          payment = await Payment.findById(booking.payment);
        } catch (err) {
          console.log(`  Error loading payment: ${err.message}`);
        }
      }
      
      // For declined bookings, ensure 100% refund
      if (booking.status === 'declined') {
        if (payment && payment.status === 'succeeded') {
          // Check if refund has already been processed
          if (payment.status !== 'refunded') {
            console.log(`  Processing 100% refund for declined booking...`);
            
            // Process refund
            payment.status = 'refunded';
            payment.refund = {
              amount: booking.total,
              reason: 'Host declined booking request',
              refundedAt: new Date(),
              refundId: 'REF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            };
            await payment.save();
            
            totalRefunded += booking.total;
            console.log(`  ✓ Refund of ₹${booking.total} processed`);
          } else {
            console.log(`  ✓ Refund already processed ($${payment.refund.amount})`);
            totalRefunded += payment.refund.amount;
          }
          
          // Send message to guest
          const message = `Dear guest, your booking has been declined and a full refund of ₹${booking.total} has been processed to your original payment method. As per our policy, when a host declines a booking, guests receive a 100% refund.`;
          console.log(`  MESSAGE TO GUEST: ${message}`);
          messagesSent++;
        } else if (payment && payment.status === 'refunded') {
          console.log(`  ✓ Refund already processed (₹${payment.refund?.amount || 0})`);
          totalRefunded += payment.refund?.amount || 0;
          
          // Send message to guest
          const message = `Dear guest, your booking has been declined and a full refund of ₹${payment.refund?.amount || 0} has been processed to your original payment method. As per our policy, when a host declines a booking, guests receive a 100% refund.`;
          console.log(`  MESSAGE TO GUEST: ${message}`);
          messagesSent++;
        } else {
          console.log(`  No payment to refund or payment not found`);
        }
      }
      
      // For cancelled bookings, apply cancellation policy
      else if (booking.status === 'cancelled') {
        // Check if this booking had a payment
        if (payment) {
          // Check if refund has already been processed
          if (payment.status === 'succeeded') {
            // Calculate refund based on cancellation policy
            const refundInfo = calculateRefundForCancellation(booking);
            
            if (refundInfo.amount > 0) {
              console.log(`  Processing ${refundInfo.percentage}% refund for cancelled booking...`);
              
              // Process refund
              payment.status = 'refunded';
              payment.refund = {
                amount: refundInfo.amount,
                reason: refundInfo.reason,
                refundedAt: new Date(),
                refundId: 'REF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
              };
              await payment.save();
              
              totalRefunded += refundInfo.amount;
              console.log(`  ✓ Refund of ₹${refundInfo.amount} processed`);
              
              // Send message to guest
              const message = `Dear guest, your booking has been cancelled and a refund of ₹${refundInfo.amount} (${refundInfo.percentage}%) has been processed to your original payment method. ${refundInfo.message}.`;
              console.log(`  MESSAGE TO GUEST: ${message}`);
              messagesSent++;
            } else {
              console.log(`  No refund due based on cancellation policy`);
              
              // Send message to guest
              const message = `Dear guest, your booking has been cancelled. As per our cancellation policy, no refund was issued as your cancellation was made less than 24 hours before check-in.`;
              console.log(`  MESSAGE TO GUEST: ${message}`);
              messagesSent++;
            }
          } else if (payment.status === 'refunded') {
            console.log(`  ✓ Refund already processed (₹${payment.refund?.amount || 0})`);
            totalRefunded += payment.refund?.amount || 0;
            
            // Send message to guest
            const refundPercentage = payment.refund?.amount ? Math.round((payment.refund.amount / booking.total) * 100) : 0;
            const message = `Dear guest, your booking has been cancelled and a refund of ₹${payment.refund?.amount || 0} (${refundPercentage}%) has been processed to your original payment method.`;
            console.log(`  MESSAGE TO GUEST: ${message}`);
            messagesSent++;
          }
        } else {
          console.log(`  No payment was required for this booking`);
          
          // Send message to guest
          const message = `Dear guest, your booking has been cancelled. No payment was processed for this booking.`;
          console.log(`  MESSAGE TO GUEST: ${message}`);
          messagesSent++;
        }
      }
    }
    
    // Calculate and display final revenue summary
    console.log(`\n=== REVENUE ADJUSTMENT SUMMARY ===`);
    console.log(`Total refunds processed: ₹${totalRefunded.toFixed(2)}`);
    console.log(`Messages sent to guests: ${messagesSent}`);
    
    // Calculate net revenue
    const allBookings = await Booking.find({});
    const totalPotentialRevenue = allBookings.reduce((sum, booking) => sum + booking.total, 0);
    
    const activeBookings = await Booking.find({ 
      status: { $in: ['confirmed', 'completed'] } 
    });
    
    let earnedRevenue = 0;
    for (const booking of activeBookings) {
      // Check if this booking has a successful payment
      if (booking.payment) {
        try {
          const payment = await Payment.findById(booking.payment);
          if (payment && payment.status === 'succeeded') {
            earnedRevenue += booking.total;
          }
        } catch (err) {
          console.log(`Error checking payment for booking ${booking._id}: ${err.message}`);
        }
      }
    }
    
    const netRevenue = earnedRevenue - totalRefunded;
    
    console.log(`\n=== FINAL REVENUE REPORT ===`);
    console.log(`Total potential revenue: ₹${totalPotentialRevenue.toFixed(2)}`);
    console.log(`Earned revenue: $${earnedRevenue.toFixed(2)}`);
    console.log(`Total refunded: ₹${totalRefunded.toFixed(2)}`);
    console.log(`Net revenue: $${netRevenue.toFixed(2)}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });

// Function to calculate refund based on cancellation policy
function calculateRefundForCancellation(booking) {
  // Calculate days until check-in
  const now = new Date();
  const checkIn = new Date(booking.checkIn);
  const daysUntilCheckIn = Math.ceil((checkIn - now) / (1000 * 60 * 60 * 24));
  
  console.log(`  Days until check-in: ${daysUntilCheckIn}`);
  
  // Apply cancellation policy
  if (daysUntilCheckIn > 7) {
    // Full refund if cancelled more than 7 days before check-in
    return {
      amount: booking.total,
      percentage: 100,
      reason: 'Full refund (more than 7 days before check-in)',
      message: 'As per our cancellation policy, you received a 100% refund as your cancellation was made more than 7 days before check-in'
    };
  } else if (daysUntilCheckIn > 3) {
    // 50% refund if cancelled 3-7 days before check-in
    return {
      amount: booking.total * 0.5,
      percentage: 50,
      reason: '50% refund (3-7 days before check-in)',
      message: 'As per our cancellation policy, you received a 50% refund as your cancellation was made 3-7 days before check-in'
    };
  } else if (daysUntilCheckIn > 1) {
    // 25% refund if cancelled 1-3 days before check-in
    return {
      amount: booking.total * 0.25,
      percentage: 25,
      reason: '25% refund (1-3 days before check-in)',
      message: 'As per our cancellation policy, you received a 25% refund as your cancellation was made 1-3 days before check-in'
    };
  } else {
    // No refund if cancelled less than 24 hours before check-in
    return {
      amount: 0,
      percentage: 0,
      reason: 'No refund (less than 24 hours before check-in)',
      message: 'As per our cancellation policy, no refund was issued as your cancellation was made less than 24 hours before check-in'
    };
  }
}