const Booking = require('../models/booking.js');
const Payment = require('../models/payment.js');

/**
 * Revenue tracking utility for real-time revenue adjustments
 */
class RevenueTracker {
    /**
     * Log a revenue adjustment when a booking is cancelled or declined
     * @param {Object} booking - The booking object
     * @param {number} refundAmount - The amount refunded
     * @param {string} reason - The reason for the refund
     */
    static logRefund(booking, refundAmount, reason) {
        console.log(`=== REVENUE ADJUSTMENT ===`);
        console.log(`Booking ID: ${booking._id}`);
        console.log(`Refund Amount: ₹${refundAmount.toFixed(2)}`);
        console.log(`Reason: ${reason}`);
        console.log(`Status: ${booking.status}`);
        console.log(`Revenue Impact: -₹${refundAmount.toFixed(2)}`);
        console.log(`========================`);
    }

    /**
     * Calculate current net revenue
     * @returns {Promise<Object>} Revenue summary
     */
    static async calculateCurrentRevenue() {
        try {
            // Get all bookings
            const allBookings = await Booking.find({});
            const totalPotentialRevenue = allBookings.reduce((sum, booking) => sum + booking.total, 0);
            
            // Get earned revenue (from confirmed/completed bookings with successful payments)
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
            
            // Get total refunded amounts
            const refundedPayments = await Payment.find({ status: 'refunded' });
            const totalRefunded = refundedPayments.reduce((sum, payment) => {
                return sum + (payment.refund?.amount || 0);
            }, 0);
            
            // Calculate net revenue
            const netRevenue = earnedRevenue - totalRefunded;
            
            return {
                totalPotentialRevenue,
                earnedRevenue,
                totalRefunded,
                netRevenue
            };
        } catch (error) {
            console.error('Error calculating revenue:', error);
            return null;
        }
    }

    /**
     * Get a summary of revenue by booking status
     * @returns {Promise<Object>} Status breakdown
     */
    static async getStatusBreakdown() {
        try {
            const allBookings = await Booking.find({});
            
            // Group by status
            const statusGroups = {};
            allBookings.forEach(booking => {
                if (!statusGroups[booking.status]) {
                    statusGroups[booking.status] = {
                        count: 0,
                        totalValue: 0,
                        refunded: 0
                    };
                }
                statusGroups[booking.status].count++;
                statusGroups[booking.status].totalValue += booking.total;
            });
            
            // Add refunded amounts to each status
            const refundedPayments = await Payment.find({ status: 'refunded' });
            for (const payment of refundedPayments) {
                const booking = await Booking.findOne({ payment: payment._id });
                if (booking && statusGroups[booking.status]) {
                    statusGroups[booking.status].refunded += payment.refund.amount;
                }
            }
            
            return statusGroups;
        } catch (error) {
            console.error('Error getting status breakdown:', error);
            return null;
        }
    }
}

module.exports = RevenueTracker;