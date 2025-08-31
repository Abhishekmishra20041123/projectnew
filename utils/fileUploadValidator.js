/**
 * File Upload Validator Utility
 * This utility helps prevent "Unexpected field" errors by validating
 * file upload field names before processing
 */

const validateFileUpload = (req, expectedFields) => {
    // Check if files exist in the request
    if (!req.files) {
        return { isValid: true, errors: [] };
    }

    const errors = [];
    const uploadedFields = Object.keys(req.files);
    
    // Check for unexpected fields
    for (const field of uploadedFields) {
        if (!expectedFields.includes(field)) {
            errors.push(`Unexpected file field: ${field}`);
        }
    }
    
    // Check for missing required fields (optional)
    // You can add this logic if needed
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        uploadedFields: uploadedFields
    };
};

// Middleware to validate file uploads
const fileUploadValidator = (expectedFields) => {
    return (req, res, next) => {
        const validation = validateFileUpload(req, expectedFields);
        
        if (!validation.isValid) {
            console.log('File upload validation errors:', validation.errors);
            
            // Add errors to flash messages
            validation.errors.forEach(error => {
                req.flash('error', error);
            });
            
            // Redirect back to form
            if (req.params.id) {
                return res.redirect(`/listings/${req.params.id}/edit`);
            } else {
                return res.redirect('/listings/new');
            }
        }
        
        // Log successful validation
        if (validation.uploadedFields.length > 0) {
            console.log('File upload validation passed for fields:', validation.uploadedFields);
        }
        
        next();
    };
};

module.exports = {
    validateFileUpload,
    fileUploadValidator
};