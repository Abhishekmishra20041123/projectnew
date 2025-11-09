// Handle multiple file uploads and provide user feedback
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== FILE UPLOAD SCRIPT LOADED ===');
    console.log('Current URL:', window.location.pathname);
    console.log('Current page contains edit?', window.location.pathname.includes('edit'));
    
    // Wait for DOM to be fully ready
    setTimeout(function() {
        console.log('=== DOM READY - SEARCHING FOR ELEMENTS ===');
        
        // Find ALL file inputs on the page
        const allFileInputs = document.querySelectorAll('input[type="file"]');
        console.log('Total file inputs found:', allFileInputs.length);
        
        allFileInputs.forEach((input, index) => {
            console.log(`File input ${index + 1}:`, {
                id: input.id,
                name: input.name,
                multiple: input.multiple,
                accept: input.accept
            });
        });
        
        // Find specific elements by name attribute as fallback
        const mainImageInput = document.querySelector('input[name="listing[image]"]');
        const additionalImagesInput = document.querySelector('input[name="listing[additionalImages]"]');
        
        console.log('Elements found by name attribute:', {
            mainImageInput: !!mainImageInput,
            additionalImagesInput: !!additionalImagesInput
        });
        
        if (mainImageInput) {
            console.log('Main image input details:', {
                id: mainImageInput.id,
                name: mainImageInput.name,
                required: mainImageInput.required
            });
        }
        
        if (additionalImagesInput) {
            console.log('Additional images input details:', {
                id: additionalImagesInput.id,
                name: additionalImagesInput.name,
                multiple: additionalImagesInput.multiple
            });
            
            // Add event listener for file selection
            additionalImagesInput.addEventListener('change', function() {
                const files = this.files;
                console.log('Files selected:', files.length);
                
                if (files.length > 0) {
                    console.log('File details:');
                    Array.from(files).forEach((file, index) => {
                        console.log(`  ${index + 1}. ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)} KB)`);
                    });
                    
                    // Find or create status display
                    let statusDiv = document.getElementById('file-count-edit') || document.getElementById('file-count');
                    if (!statusDiv) {
                        statusDiv = document.createElement('div');
                        statusDiv.id = 'file-status';
                        statusDiv.className = 'small text-info mt-1';
                        this.parentNode.appendChild(statusDiv);
                    }
                    
                    statusDiv.textContent = `${files.length} image(s) selected`;
                    statusDiv.className = files.length > 10 ? 'small text-danger mt-1' : 'small text-success mt-1';
                    
                    if (files.length > 10) {
                        statusDiv.textContent = `Too many files! Please select maximum 10 images (${files.length} selected)`;
                    }
                } else {
                    // Clear status
                    const statusDiv = document.getElementById('file-count-edit') || document.getElementById('file-count') || document.getElementById('file-status');
                    if (statusDiv) {
                        statusDiv.textContent = '';
                    }
                }
            });
        }
        
        console.log('=== FILE UPLOAD SETUP COMPLETED ===');
        
    }, 1000); // Increased delay to 1 second
    
    // Handle form submission
    document.addEventListener('submit', function(e) {
        const form = e.target;
        if (form.enctype === 'multipart/form-data') {
            console.log('=== FORM SUBMISSION DETECTED ===');
            console.log('Form action:', form.action);
            console.log('Form method:', form.method);
            
            const formData = new FormData(form);
            console.log('Form data entries:');
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`  ${key}: File - ${value.name} (${value.type}, ${value.size} bytes)`);
                } else {
                    console.log(`  ${key}: ${value}`);
                }
            }
        }
    });
});