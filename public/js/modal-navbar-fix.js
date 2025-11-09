/**
 * Modal Navbar Fix
 * This script ensures the navbar doesn't overlap with modal content
 * by adjusting z-index values when a modal is opened
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Modal navbar fix script loaded');
    
    // Fix for imageModal z-index to prevent navbar overlap
    function setupModalNavbarFix() {
        console.log('Setting up modal z-index fix');
        
        // Find all modals
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
            // When modal starts to open
            modal.addEventListener('show.bs.modal', function() {
                console.log('Modal showing - adjusting navbar z-index');
                // Lower the navbar z-index when modal is open
                const navbar = document.querySelector('.navbar');
                if (navbar) {
                    navbar.style.zIndex = '1';
                }
            });
            
            // When modal is fully open
            modal.addEventListener('shown.bs.modal', function() {
                console.log('Modal shown - setting modal z-index');
                // Ensure modal and backdrop have higher z-index
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                    backdrop.style.zIndex = '9999';
                }
                modal.style.zIndex = '10000';
            });
            
            // When modal is closed
            modal.addEventListener('hidden.bs.modal', function() {
                console.log('Modal hidden - restoring navbar z-index');
                // Restore navbar z-index
                const navbar = document.querySelector('.navbar');
                if (navbar) {
                    navbar.style.zIndex = '9998';
                }
            });
        });
    }
    
    // Run the fix
    setupModalNavbarFix();
    
    // Also run the fix again when new modals might be added
    // This is a fallback for dynamically created modals
    setTimeout(setupModalNavbarFix, 1000);
});