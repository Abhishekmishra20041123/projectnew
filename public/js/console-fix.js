/**
 * Guest Counter Fix for Console Execution
 * 
 * Copy and paste this entire script into the browser console when viewing the show page,
 * then reload the page for permanent effect.
 */

// Create a script element
const script = document.createElement('script');
script.src = '/js/guest-counter-fix.js';
script.onload = function() {
    console.log('Guest counter fix script loaded successfully');
};
script.onerror = function() {
    console.error('Failed to load guest counter fix script');
    
    // If the script fails to load, apply fixes directly
    applyGuestCounterFixes();
};

// Add the script to the document
document.head.appendChild(script);

// Direct fix function in case script loading fails
function applyGuestCounterFixes() {
    if (window.bookingManager) {
        console.log('Applying guest counter fixes directly');
        
        // Fix 1: Override the changeGuestCount method
        const originalChangeGuestCount = window.bookingManager.changeGuestCount;
        window.bookingManager.changeGuestCount = function(type, change) {
            console.log(`Fixed changeGuestCount: ${type} by ${change}`);
            
            const limits = {
                adults: { min: 1, max: this.maxGuests },
                children: { min: 0, max: this.maxGuests },
                infants: { min: 0, max: 5 }
            };
            
            const newCount = this.guestCounts[type] + change;
            const totalGuests = this.guestCounts.adults + this.guestCounts.children;
            
            // Special case for increasing adults or children
            if ((type === 'adults' || type === 'children') && change > 0) {
                if (totalGuests >= this.maxGuests) {
                    console.log('Maximum guests reached');
                    return;
                }
            }
            
            // Check if new count is within limits
            if (newCount >= limits[type].min && newCount <= limits[type].max) {
                // Update the count
                this.guestCounts[type] = newCount;
                
                // Update display
                const countElement = document.getElementById(`${type}Count`);
                if (countElement) {
                    countElement.textContent = newCount;
                }
                
                // Update button states
                this.updateGuestCounterButtons();
            }
        };
        
        // Fix 2: Override the updateGuestCounterButtons method
        window.bookingManager.updateGuestCounterButtons = function() {
            const types = ['adults', 'children', 'infants'];
            const totalGuests = this.guestCounts.adults + this.guestCounts.children;
            
            types.forEach(type => {
                const decreaseBtn = document.getElementById(`${type}Decrease`);
                const increaseBtn = document.getElementById(`${type}Increase`);
                
                if (!decreaseBtn || !increaseBtn) return;
                
                const count = this.guestCounts[type];
                
                // Determine decrease button state
                if (type === 'adults') {
                    decreaseBtn.disabled = count <= 1;
                } else {
                    decreaseBtn.disabled = count <= 0;
                }
                
                // Determine increase button state
                if (type === 'infants') {
                    // Infants don't count towards maximum guests
                    increaseBtn.disabled = count >= 5;
                } else if (type === 'adults') {
                    // Check if adding another adult would exceed maximum
                    increaseBtn.disabled = (totalGuests >= this.maxGuests);
                } else if (type === 'children') {
                    // Check if adding another child would exceed maximum
                    increaseBtn.disabled = (totalGuests >= this.maxGuests);
                }
            });
        };
        
        // Fix 3: Add direct event handlers to buttons
        ['adults', 'children', 'infants'].forEach(type => {
            const decreaseBtn = document.getElementById(`${type}Decrease`);
            const increaseBtn = document.getElementById(`${type}Increase`);
            
            if (decreaseBtn) {
                decreaseBtn.onclick = function() {
                    window.bookingManager.changeGuestCount(type, -1);
                    return false;
                };
            }
            
            if (increaseBtn) {
                increaseBtn.onclick = function() {
                    window.bookingManager.changeGuestCount(type, 1);
                    return false;
                };
            }
        });
        
        // Fix 4: Override the openGuestModal method
        const originalOpenGuestModal = window.bookingManager.openGuestModal;
        window.bookingManager.openGuestModal = function() {
            // Call the original method
            originalOpenGuestModal.call(this);
            
            // Apply fixes after modal is opened
            setTimeout(() => {
                this.updateGuestCounterButtons();
                
                // Re-add direct handlers
                ['adults', 'children', 'infants'].forEach(type => {
                    const decreaseBtn = document.getElementById(`${type}Decrease`);
                    const increaseBtn = document.getElementById(`${type}Increase`);
                    
                    if (decreaseBtn) {
                        decreaseBtn.onclick = function() {
                            window.bookingManager.changeGuestCount(type, -1);
                            return false;
                        };
                    }
                    
                    if (increaseBtn) {
                        increaseBtn.onclick = function() {
                            window.bookingManager.changeGuestCount(type, 1);
                            return false;
                        };
                    }
                });
            }, 100);
        };
        
        // Apply fixes immediately
        window.bookingManager.updateGuestCounterButtons();
        
        console.log('Guest counter fixes applied directly');
    } else {
        console.error('BookingManager not found - cannot apply fixes directly');
    }
}

// Execute fix checks after a delay
setTimeout(function() {
    if (!window.guestCounterFixApplied) {
        console.log('Checking if fixes need to be applied directly...');
        applyGuestCounterFixes();
        window.guestCounterFixApplied = true;
    }
}, 1000);

// Also create a fix function that can be called from the console
window.fixGuestCounter = function() {
    applyGuestCounterFixes();
    console.log('Guest counter fixes applied via manual call');
    return 'Guest counter fixed! Try opening the guest modal now.';
};

console.log('Guest counter fix initialization complete. If you still see issues, run window.fixGuestCounter() in the console.');