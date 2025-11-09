const mongoose = require('mongoose');
const Booking = require('./models/booking.js');
const Payment = require('./models/payment.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Create a test booking with a check-in date one month from now
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    
    const checkInDate = new Date(oneMonthFromNow);
    checkInDate.setDate(checkInDate.getDate() + 10); // 10 days after one month
    
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + 3); // 3-night stay
    
    // Create a test booking
    const testBooking = new Booking({
      listing: '688603b8f7dc9c2b4d09fe1d', // Using an existing listing ID
      guest: '688602dbf7dc9c2b4d09fd7f', // Using an existing user ID
      host: '688602dbf7dc9c2b4d09fd7f', // Using an existing user ID
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights: 3,
      guests: 2,
      basePrice: 300,
      cleaningFee: 30,
      serviceFee: 42,
      taxes: 45,
      total: 417,
      status: 'confirmed',
      paymentStatus: 'paid'
    });
    
    // Save the booking
    await testBooking.save();
    console.log(`Created test booking: ${testBooking._id}`);
    console.log(`Check-in date: ${testBooking.checkIn}`);
    console.log(`Check-out date: ${testBooking.checkOut}`);
    console.log(`Total amount: ₹${testBooking.total}`);
    
    // Create a payment record for this booking
    const testPayment = new Payment({
      booking: testBooking._id,
      user: testBooking.guest,
      amount: testBooking.total,
      currency: 'USD',
      paymentMethod: 'card',
      status: 'succeeded',
      transactionId: 'TXN_TEST_' + Date.now(),
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
    console.log(`Created test payment: ${testPayment._id}`);
    
    // Link payment to booking
    testBooking.payment = testPayment._id;
    await testBooking.save();
    
    // Simulate guest cancelling the booking (more than 7 days before check-in)
    console.log('\nSimulating guest cancellation (more than 7 days before check-in)...');
    
    // Update booking status to cancelled
    testBooking.status = 'cancelled';
    testBooking.cancelledAt = new Date();
    testBooking.cancelledBy = testBooking.guest;
    await testBooking.save();
    
    console.log('Booking status updated to cancelled');
    
    // Calculate refund according to policy (more than 7 days = 100% refund)
    const refundAmount = testBooking.total; // 100% refund
    const refundReason = 'Full refund (more than 7 days before check-in)';
    
    console.log(`Processing refund: ₹${refundAmount} (${refundReason})`);
    
    // Update payment with refund information
    testPayment.status = 'refunded';
    testPayment.refund = {
      amount: refundAmount,
      reason: refundReason,
      refundedAt: new Date(),
      refundId: 'REF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    };
    await testPayment.save();
    
    console.log('Payment updated with refund information');
    
    // Generate message to guest
    const message = `Dear guest, your booking has been cancelled and a full refund of ₹${refundAmount} has been processed to your original payment method. As per our cancellation policy, you received a 100% refund as your cancellation was made more than 7 days before check-in.`;
    
    console.log('\nMESSAGE TO GUEST:');
    console.log(message);
    
    // Show revenue adjustment
    console.log('\n=== REVENUE ADJUSTMENT ===');
    console.log(`Booking total: ₹${testBooking.total}`);
    console.log(`Refund amount: ₹${refundAmount}`);
    console.log(`Revenue adjustment: -₹${refundAmount}`);
    
    console.log('\nTest completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });