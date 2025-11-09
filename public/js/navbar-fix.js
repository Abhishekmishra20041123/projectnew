/**
 * Navbar Dropdown Fix
 * This script ensures Bootstrap dropdowns work correctly even if there are timing issues
 * with Bootstrap initialization.
 */
(function() {
  console.log('Navbar dropdown fix loaded');

  // Function to check if Bootstrap is fully loaded
  function isBootstrapLoaded() {
    return typeof bootstrap !== 'undefined' && typeof bootstrap.Dropdown !== 'undefined';
  }
  
  // Function to initialize dropdowns with Bootstrap
  function initializeBootstrapDropdowns() {
    console.log('Initializing dropdowns with Bootstrap');
    var dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
    dropdownElementList.forEach(function(dropdownToggleEl) {
      try {
        new bootstrap.Dropdown(dropdownToggleEl);
      } catch (e) {
        console.error('Error initializing dropdown with Bootstrap:', e);
      }
    });
  }
  
  // Function to initialize manual dropdown functionality as fallback
  function initializeManualDropdowns() {
    console.log('Initializing manual dropdown fallback');
    var dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(function(toggle) {
      toggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var dropdownMenu = this.nextElementSibling;
        if (dropdownMenu && dropdownMenu.classList.contains('dropdown-menu')) {
          var isOpen = dropdownMenu.classList.contains('show');
          
          // Close all other dropdowns
          document.querySelectorAll('.dropdown-menu.show').forEach(function(menu) {
            if (menu !== dropdownMenu) {
              menu.classList.remove('show');
            }
          });
          
          // Toggle current dropdown
          dropdownMenu.classList.toggle('show');
        }
      });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu.show').forEach(function(menu) {
          menu.classList.remove('show');
        });
      }
    });
  }
  
  // Function to attempt initialization
  function attemptInitialization() {
    if (isBootstrapLoaded()) {
      initializeBootstrapDropdowns();
    } else {
      console.log('Bootstrap not available, using manual fallback');
      initializeManualDropdowns();
    }
  }
  
  // Try to initialize immediately if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attemptInitialization);
  } else {
    attemptInitialization();
  }
  
  // Try again after a short delay
  setTimeout(function() {
    if (isBootstrapLoaded()) {
      console.log('Bootstrap available after delay, re-initializing dropdowns');
      initializeBootstrapDropdowns();
    }
  }, 500);
  
  // Also try on window load for maximum reliability
  window.addEventListener('load', function() {
    console.log('Window loaded, ensuring dropdowns are initialized');
    attemptInitialization();
  });
  
  // Provide a global function for manual initialization that can be called from the console
  window.fixNavbarDropdowns = function() {
    console.log('Manual dropdown fix called');
    attemptInitialization();
    return 'Navbar dropdowns fixed. Try clicking the dropdown now.';
  };
})();