/**
 * Booking Response Helper
 * This file provides fallback functionality for responding to booking requests
 */

// Global function to navigate to respond page
function respondToBooking(bookingId) {
    if (!bookingId) {
        console.error('No booking ID provided');
        return false;
    }
    
    console.log('Navigating to respond page for booking:', bookingId);
    try {
        window.location.href = '/bookings/' + bookingId + '/respond';
        return false; // Prevent default action if used in onclick
    } catch (error) {
        console.error('Navigation error:', error);
        // Fallback to a form submission approach
        var form = document.createElement('form');
        form.method = 'GET';
        form.action = '/bookings/' + bookingId + '/respond';
        document.body.appendChild(form);
        form.submit();
        return false;
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Booking response helper loaded');
    
    // Add respond functionality to all respond buttons
    var respondButtons = document.querySelectorAll('.respond-button, [data-respond-id]');
    respondButtons.forEach(function(button) {
        var bookingId = button.getAttribute('data-respond-id') || 
                       button.getAttribute('href').split('/respond')[0].split('/').pop();
                       
        if (bookingId) {
            button.onclick = function(e) {
                e.preventDefault();
                return respondToBooking(bookingId);
            };
        }
    });
});

// Add respond function to window for global access
window.respondToBooking = respondToBooking;