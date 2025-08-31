/**
 * Image Replacement Fix for Edit Form
 * 
 * This script enhances the image replacement functionality in the edit form to:
 * 1. Clearly indicate when images will be replaced
 * 2. Provide visual feedback during the process
 * 3. Confirm replacement actions with the user
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Image replacement fix loaded');
    
    // Add visual enhancements to the image replacement section
    enhanceImageReplacementUI();
    
    // Add confirmation dialog for image replacement
    addImageReplacementConfirmation();
});

/**
 * Enhance the UI for image replacement to make it more clear
 */
function enhanceImageReplacementUI() {
    // Style the "Replace All Additional Images" label
    const additionalImagesLabel = document.querySelector('label[for="additional-images-update"]');
    if (additionalImagesLabel) {
        additionalImagesLabel.style.cssText = `
            color: #dc3545 !important;
            font-weight: bold !important;
            font-size: 1.1em !important;
            display: block !important;
            margin-bottom: 0.5rem !important;
        `;
    }
    
    // Style the warning alert
    const warningAlert = document.querySelector('.alert-warning');
    if (warningAlert) {
        warningAlert.style.cssText = `
            border-left: 4px solid #dc3545 !important;
            background-color: #fff3cd !important;
            border-radius: 0.375rem !important;
            padding: 1rem !important;
            margin-top: 0.5rem !important;
        `;
    }
    
    // Add icon to the warning message
    if (warningAlert) {
        const icon = document.createElement('i');
        icon.className = 'bi bi-exclamation-triangle-fill me-2';
        icon.style.cssText = 'font-size: 1.2em; vertical-align: middle;';
        warningAlert.insertBefore(icon, warningAlert.firstChild);
    }
    
    // Add visual indicator to the file input
    const additionalImagesInput = document.getElementById('additional-images-update');
    if (additionalImagesInput) {
        additionalImagesInput.style.cssText = `
            border: 2px dashed #dc3545 !important;
            background-color: #fff !important;
            padding: 0.75rem !important;
            border-radius: 0.375rem !important;
        `;
    }
}

/**
 * Add confirmation dialog for image replacement
 */
function addImageReplacementConfirmation() {
    const form = document.getElementById('edit-listing-form');
    const additionalImagesInput = document.getElementById('additional-images-update');
    
    if (form && additionalImagesInput) {
        form.addEventListener('submit', function(e) {
            // Check if new additional images are selected
            if (additionalImagesInput.files && additionalImagesInput.files.length > 0) {
                // Get the number of existing additional images
                const existingImagesCount = document.querySelectorAll('.card-img-top').length;
                const newImagesCount = additionalImagesInput.files.length;
                
                // Show confirmation dialog
                const message = `
You are about to REPLACE ALL existing additional images with ${newImagesCount} new image(s).
                    
Current additional images: ${existingImagesCount}
New images to upload: ${newImagesCount}

This action cannot be undone. The old images will be permanently deleted.
                    
Do you want to continue?
                `.trim();
                
                if (!confirm(message)) {
                    e.preventDefault();
                    console.log('Image replacement cancelled by user');
                    return false;
                }
                
                console.log(`User confirmed replacement of ${existingImagesCount} images with ${newImagesCount} new images`);
            }
        });
    }
}