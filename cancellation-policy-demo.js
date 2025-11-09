const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const Payment = require('./models/payment.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('=== CANCELLATION POLICY DEMO ===\n');
    
    // Create test scenarios for different cancellation timings
    const scenarios = [
      {
        name: "More than 7 days before check-in (100% refund)",
        daysBefore: 10,
        expectedRefund: 100
      },
      {
        name: "3-7 days before check-in (50% refund)",
        daysBefore: 5,
        expectedRefund: 50
      },
      {
        name: "1-3 days before check-in (25% refund)",
        daysBefore: 2,
        expectedRefund: 25
      },
      {
        name: "Less than 24 hours before check-in (0% refund)",
        daysBefore: 0.5,
        expectedRefund: 0
      }
    ];
    
    let totalRevenueImpact = 0;
    
    for (const scenario of scenarios) {
      console.log(`--- ${scenario.name} ---`);
      
      // Create a test booking
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + scenario.daysBefore);
      
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 3); // 3-night stay
      
      const totalAmount = 400; // Fixed amount for easier calculation
      
      const testBooking = new Booking({
        listing: '688603b8f7dc9c2b4d09fe1d',
        guest: '688602dbf7dc9c2b4d09fd7f',
        host: '688602dbf7dc9c2b4d09fd7f',
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights: 3,
        guests: 2,
        basePrice: 300,
        cleaningFee: 30,
        serviceFee: 42,
        taxes: 28,
        total: totalAmount,
        status: 'confirmed',
        paymentStatus: 'paid'
      });
      
      await testBooking.save();
      
      // Create payment
      const testPayment = new Payment({
        booking: testBooking._id,
        user: testBooking.guest,
        amount: totalAmount,
        currency: 'USD',
        paymentMethod: 'card',
        status: 'succeeded',
        transactionId: 'TXN_TEST_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        description: 'Test booking payment',
        billingAddress: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        }
      });
      
      await testPayment.save();
      testBooking.payment = testPayment._id;
      await testBooking.save();
      
      console.log(`Booking ID: ${testBooking._id}`);
      console.log(`Total amount: ₹${totalAmount}`);
      console.log(`Check-in date: ${checkInDate.toDateString()}`);
      
      // Simulate cancellation
      testBooking.status = 'cancelled';
      testBooking.cancelledAt = new Date();
      testBooking.cancelledBy = testBooking.guest;
      await testBooking.save();
      
      // Calculate refund based on policy
      const refundInfo = calculateRefundForCancellation(testBooking);
      const refundAmount = refundInfo.amount;
      
      console.log(`Refund amount: ₹${refundAmount} (${refundInfo.percentage}%)`);
      
      // Process refund if applicable
      if (refundAmount > 0) {
        testPayment.status = 'refunded';
        testPayment.refund = {
          amount: refundAmount,
          reason: refundInfo.reason,
          refundedAt: new Date(),
          refundId: 'REF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        };
        await testPayment.save();
      }
      
      // Generate guest message
      let guestMessage;
      if (refundAmount > 0) {
        guestMessage = `Dear guest, your booking has been cancelled and a refund of ₹${refundAmount} (${refundInfo.percentage}%) has been processed to your original payment method. ${refundInfo.message}.`;
      } else {
        guestMessage = `Dear guest, your booking has been cancelled. As per our cancellation policy, no refund was issued as your cancellation was made less than 24 hours before check-in.`;
      }
      
      console.log(`MESSAGE TO GUEST: ${guestMessage}`);
      
      // Track revenue impact
      totalRevenueImpact += refundAmount;
      console.log(`Revenue impact: -₹${refundAmount}\n`);
    }
    
    console.log('=== SUMMARY ===');
    console.log(`Total revenue adjustment: -₹${totalRevenueImpact}`);
    console.log('All scenarios processed according to cancellation policy');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

// Function to calculate refund based on cancellation policy
function calculateRefundForCancellation(booking) {
  // Calculate days until check-in
  const now = new Date();
  const checkIn = new Date(booking.checkIn);
  const daysUntilCheckIn = Math.ceil((checkIn - now) / (1000 * 60 * 60 * 24));
  
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