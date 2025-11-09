const mongoose = require('mongoose');
const RevenueTracker = require('./utils/revenueTracker.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('=== REVENUE TRACKING TEST ===\n');
    
    // Test revenue calculation
    console.log('Calculating current revenue...');
    const revenueSummary = await RevenueTracker.calculateCurrentRevenue();
    
    if (revenueSummary) {
      console.log('\n=== REVENUE SUMMARY ===');
      console.log(`Total Potential Revenue: ₹${revenueSummary.totalPotentialRevenue.toFixed(2)}`);
      console.log(`Earned Revenue: ₹${revenueSummary.earnedRevenue.toFixed(2)}`);
      console.log(`Total Refunded: ₹${revenueSummary.totalRefunded.toFixed(2)}`);
      console.log(`Net Revenue: ₹${revenueSummary.netRevenue.toFixed(2)}`);
    }
    
    // Test status breakdown
    console.log('\nCalculating status breakdown...');
    const statusBreakdown = await RevenueTracker.getStatusBreakdown();
    
    if (statusBreakdown) {
      console.log('\n=== STATUS BREAKDOWN ===');
      Object.keys(statusBreakdown).forEach(status => {
        const data = statusBreakdown[status];
        console.log(`${status}: ${data.count} bookings, ₹${data.totalValue.toFixed(2)} value, ₹${data.refunded.toFixed(2)} refunded`);
      });
    }
    
    console.log('\n=== TEST COMPLETE ===');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });