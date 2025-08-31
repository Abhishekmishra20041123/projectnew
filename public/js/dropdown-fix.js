/**
 * Universal Dropdown Fix
 * This script ensures dropdown functionality works on every page
 * regardless of Bootstrap loading status
 */

(function() {
  // Execute immediately to ensure dropdown functionality
  
  // Function to handle dropdown toggling
  function setupDropdowns() {
    console.log('Setting up universal dropdown functionality');
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
      if (!event.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu.show').forEach(function(menu) {
          menu.classList.remove('show');
        });
      }
    });
    
    // Add click handlers to any dropdowns without them
    document.querySelectorAll('.dropdown-toggle').forEach(function(toggle) {
      if (!toggle.hasAttribute('onclick')) {
        toggle.setAttribute('onclick', 'toggleDropdown(event)');
      }
    });
  }
  
  // Helper function to ensure dropdown stays within viewport
  function ensureDropdownInViewport(dropdown) {
    if (!dropdown) return;
    
    // Get dropdown dimensions and position
    const rect = dropdown.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    
    // Check if dropdown extends beyond right edge of viewport
    if (rect.right > viewportWidth) {
      console.log('Fixing dropdown position - outside right edge');
      dropdown.style.right = '0';
      dropdown.style.left = 'auto';
    }
    
    // Check if dropdown extends beyond bottom of viewport
    if (rect.bottom > viewportHeight) {
      console.log('Fixing dropdown height - outside bottom edge');
      const maxHeight = viewportHeight - rect.top - 20; // 20px buffer
      dropdown.style.maxHeight = maxHeight + 'px';
      dropdown.style.overflowY = 'auto';
    }
  }
  
  // Global function to toggle dropdown visibility
  window.toggleDropdown = function(event) {
    event.preventDefault();
    
    // Find the dropdown menu
    var dropdown = event.currentTarget.nextElementSibling;
    if (!dropdown || !dropdown.classList.contains('dropdown-menu')) {
      console.log('Dropdown menu not found');
      return;
    }
    
    // Toggle the 'show' class to display/hide the dropdown
    if (dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
    } else {
      // Close any other open dropdowns first
      document.querySelectorAll('.dropdown-menu.show').forEach(function(menu) {
        menu.classList.remove('show');
      });
      
      dropdown.classList.add('show');
      
      // Ensure dropdown stays within viewport boundaries
      ensureDropdownInViewport(dropdown);
    }
  };
  
  // Setup dropdowns on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDropdowns);
  } else {
    setupDropdowns();
  }
  
  // Also run on window load for maximum reliability
  window.addEventListener('load', setupDropdowns);
  
  // Provide a global function that can be called manually if needed
  window.fixAllDropdowns = function() {
    setupDropdowns();
    return 'All dropdowns fixed and initialized';
  };
})();