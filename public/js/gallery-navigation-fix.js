/**
 * Gallery Navigation Fix
 * 
 * This script fixes three issues with the image gallery:
 * 1. Makes navigation buttons more visible
 * 2. Ensures the clicked image is displayed in the modal
 * 3. Adds keyboard navigation support
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Gallery navigation fix loaded');
    
    // Fix navigation button styles
    enhanceNavigationButtons();
    
    // Override the openImageModal function to correctly start at the clicked image
    fixImageModalStartIndex();
    
    // Add keyboard navigation
    addKeyboardNavigation();
});

/**
 * Enhance the visibility of navigation buttons
 */
function enhanceNavigationButtons() {
    const style = document.createElement('style');
    style.textContent = `
        /* Enhance navigation buttons */
        .modal-body .position-absolute[onclick] {
            top: 50% !important;
            transform: translateY(-50%) !important;
            width: 100px !important;
            height: 100px !important;
            cursor: pointer;
            z-index: 1050;
        }
        
        .modal-body .position-absolute[onclick] > div {
            width: 60px !important;
            height: 60px !important;
            background-color: rgba(0, 0, 0, 0.75) !important;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }
        
        .modal-body .position-absolute[onclick] > div:hover {
            transform: scale(1.1);
            background-color: rgba(0, 0, 0, 0.9) !important;
        }
        
        .modal-body .position-absolute[onclick] i {
            font-size: 2rem !important;
            color: white;
            filter: drop-shadow(0px 0px 3px rgba(0, 0, 0, 0.7));
        }
        
        /* Mobile responsiveness */
        @media (max-width: 768px) {
            .modal-body .position-absolute[onclick] {
                width: 70px !important;
                height: 70px !important;
            }
            
            .modal-body .position-absolute[onclick] > div {
                width: 50px !important;
                height: 50px !important;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Fix the starting index in the image modal
 */
function fixImageModalStartIndex() {
    // Store the original function
    if (typeof window.originalOpenImageModal === 'undefined' && typeof window.openImageModal === 'function') {
        window.originalOpenImageModal = window.openImageModal;
        
        // Override with our enhanced version
        window.openImageModal = function(index, type) {
            console.log('Enhanced openImageModal:', index, type);
            
            // Make sure gallery images are prepared
            if (window.galleryImages && window.galleryImages.length === 0) {
                if (typeof window.prepareGalleryImages === 'function') {
                    window.prepareGalleryImages();
                }
            }
            
            // Calculate the correct starting index
            let startIndex = 0;
            
            if (type === 'main') {
                startIndex = 0;
            } else if (type === 'additional' && index >= 0) {
                // Check if we have a main image
                const hasMainImage = document.querySelector('.img-fluid.rounded-start.w-100') !== null;
                
                if (hasMainImage) {
                    // Add 1 to account for the main image
                    startIndex = index + 1;
                } else {
                    startIndex = index;
                }
            } else if (type === 'all' && index >= 0) {
                startIndex = index;
            }
            
            console.log('Setting starting index to:', startIndex);
            
            // Set the current image index
            window.currentImageIndex = startIndex;
            
            // Call the original function
            window.originalOpenImageModal(index, type);
            
            // After the modal is shown, make sure the correct image is displayed
            setTimeout(function() {
                if (typeof window.updateModalImage === 'function') {
                    console.log('Updating modal image to index:', startIndex);
                    window.currentImageIndex = startIndex;
                    window.updateModalImage();
                }
            }, 200);
        };
    }
}

/**
 * Add keyboard navigation support
 */
function addKeyboardNavigation() {
    document.addEventListener('keydown', function(event) {
        const imageModal = document.getElementById('imageModal');
        if (imageModal && imageModal.classList.contains('show')) {
            if (event.key === 'ArrowLeft') {
                if (typeof window.previousImage === 'function') {
                    window.previousImage();
                }
            } else if (event.key === 'ArrowRight') {
                if (typeof window.nextImage === 'function') {
                    window.nextImage();
                }
            }
        }
    });
}