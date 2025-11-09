/**
 * Guest Counter Fix for Listing Show Page
 * This script fixes issues with the guest counter in the show.ejs file
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Guest counter fix script loaded');
    
    // Wait for the BookingManager to be initialized
    setTimeout(function() {
        if (window.bookingManager) {
            console.log('Applying guest counter fixes');
            
            // Fix 1: Override the changeGuestCount method to fix calculation logic
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
                
                console.log(`Current count: ${this.guestCounts[type]}, New count: ${newCount}`);
                console.log(`Total guests: ${totalGuests}, Max guests: ${this.maxGuests}`);
                
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
                        console.log(`Updated ${type} display to ${newCount}`);
                    } else {
                        console.error(`Element ${type}Count not found`);
                    }
                    
                    // Update button states
                    this.updateGuestCounterButtons();
                } else {
                    console.log(`Cannot update ${type} count to ${newCount} (min: ${limits[type].min}, max: ${limits[type].max})`);
                }
            };
            
            // Fix 2: Override the updateGuestCounterButtons method to fix button state logic
            const originalUpdateGuestCounterButtons = window.bookingManager.updateGuestCounterButtons;
            window.bookingManager.updateGuestCounterButtons = function() {
                const types = ['adults', 'children', 'infants'];
                const totalGuests = this.guestCounts.adults + this.guestCounts.children;
                
                console.log('Fixed updateGuestCounterButtons, current counts:', this.guestCounts);
                console.log('Total guests:', totalGuests, 'Max guests:', this.maxGuests);
                
                types.forEach(type => {
                    const decreaseBtn = document.getElementById(`${type}Decrease`);
                    const increaseBtn = document.getElementById(`${type}Increase`);
                    
                    if (!decreaseBtn || !increaseBtn) {
                        console.log(`Button elements for ${type} not found`);
                        return;
                    }
                    
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
                    
                    console.log(`${type} buttons - decrease: ${decreaseBtn.disabled}, increase: ${increaseBtn.disabled}`);
                });
            };
            
            // Fix 3: Add direct event handlers to the buttons
            function addDirectButtonHandlers() {
                console.log('Adding direct button handlers');
                
                // Add handlers for each guest type
                ['adults', 'children', 'infants'].forEach(type => {
                    const decreaseBtn = document.getElementById(`${type}Decrease`);
                    const increaseBtn = document.getElementById(`${type}Increase`);
                    
                    if (decreaseBtn) {
                        decreaseBtn.onclick = function(e) {
                            console.log(`Direct ${type} decrease clicked`);
                            window.bookingManager.changeGuestCount(type, -1);
                            return false;
                        };
                    }
                    
                    if (increaseBtn) {
                        increaseBtn.onclick = function(e) {
                            console.log(`Direct ${type} increase clicked`);
                            window.bookingManager.changeGuestCount(type, 1);
                            return false;
                        };
                    }
                });
            }
            
            // Fix 4: Override the openGuestModal method to ensure handlers are added
            const originalOpenGuestModal = window.bookingManager.openGuestModal;
            window.bookingManager.openGuestModal = function() {
                console.log('Fixed openGuestModal called');
                
                // Call the original method
                originalOpenGuestModal.call(this);
                
                // Add direct handlers and fix button states
                setTimeout(function() {
                    addDirectButtonHandlers();
                    window.bookingManager.updateGuestCounterButtons();
                }, 100);
            };
            
            // Apply fixes immediately
            window.bookingManager.updateGuestCounterButtons();
            
            // Also fix the confirmGuests handler
            const confirmBtn = document.getElementById('confirmGuests');
            if (confirmBtn) {
                confirmBtn.onclick = function() {
                    console.log('Direct confirmGuests clicked');
                    window.bookingManager.confirmGuests();
                    return false;
                };
            }
            
            console.log('Guest counter fixes applied successfully');
        } else {
            console.error('BookingManager not found - guest counter fixes not applied');
        }
    }, 500); // Wait for BookingManager to be initialized
});