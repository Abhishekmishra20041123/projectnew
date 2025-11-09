const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const geocodingClient = mbxGeocoding({ accessToken: process.env.MAP_TOKEN });
const { cloudinary } = require("../cloudConfig.js");
const { deleteImagesFromCloudinary } = require("../utils/cloudinary.js"); // Add utility import

module.exports.index = async (req, res) => {
    const { category } = req.query;
    let allist;

    if (!category || category.trim() === "") {
        // No category selected, show all
        allist = await Listing.find({});
    } else {
        // Filter by selected category
        allist = await Listing.find({ category });
    }

    res.render("./listings/index.ejs", { allist, category });
};

module.exports.rendernewform = (req,res)=>{   //it shouldbe write before /listings/:id this method because then new will act as variable like search in google
    res.render("listings/new.ejs");
};

module.exports.showlisting = async (req,res)=>{
    let {id} = req.params;
    const listdata = await Listing.findById(id)
    .select("+geometry")
    .populate({path:"reviews",
        populate:[
            {
                path:"author",
                populate: {
                    path: "profile"
                }
            },
            {
                path: "helpfulUsers"
            }
        ],
    })
    .populate("owner");
    
    // Debug logging
    console.log('=== DEBUG: showlisting controller ===');
    console.log('Listing ID:', id);
    console.log('Listing data found:', !!listdata);
    if (listdata) {
        console.log('Listing title:', listdata.title);
        console.log('Geometry data:', listdata.geometry);
        console.log('Geometry type:', typeof listdata.geometry);
        if (listdata.geometry) {
            console.log('Geometry coordinates:', listdata.geometry.coordinates);
            console.log('Coordinates type:', typeof listdata.geometry.coordinates);
        }
    }
    
    const mapToken = process.env.MAP_TOKEN || "";
    console.log('Map token available:', !!mapToken);
    
    if(!listdata){
        req.flash("error","list does not exist");
        res.redirect("/listings");
    }else {
        console.log('Rendering show.ejs with listdata and mapToken');
        res.render("./listings/show.ejs",{listdata, mapToken})
    }
};

// New test map route
module.exports.testmap = async (req,res)=>{
    // Get a sample listing with geometry data
    const listdata = await Listing.findOne().select("+geometry");
    
    // Debug logging
    console.log('=== DEBUG: testmap controller ===');
    console.log('Sample listing data found:', !!listdata);
    if (listdata) {
        console.log('Listing title:', listdata.title);
        console.log('Geometry data:', listdata.geometry);
        console.log('Geometry type:', typeof listdata.geometry);
        if (listdata.geometry) {
            console.log('Geometry coordinates:', listdata.geometry.coordinates);
            console.log('Coordinates type:', typeof listdata.geometry.coordinates);
        }
    }
    
    const mapToken = process.env.MAP_TOKEN || "";
    console.log('Map token available:', !!mapToken);
    
    if(!listdata){
        req.flash("error","No listings available for testing");
        res.redirect("/listings");
    }else {
        console.log('Rendering testmap.ejs with listdata and mapToken');
        res.render("testmap.ejs",{listdata, mapToken})
    }
};

module.exports.createlisting = async (req, res) => {
   if(!req.user) {
       req.flash("error", "You must be logged in to create a listing");
       return res.redirect("/login");
   }
   
   console.log('=== CREATE LISTING START ===');
   console.log('Files received in controller:', req.files ? Object.keys(req.files).length : 0);
   console.log('Body received:', JSON.stringify(req.body, null, 2));
   if (req.files) {
       console.log('Actual field names in req.files:', Object.keys(req.files));
       for (const fieldName of Object.keys(req.files)) {
           console.log(`Field: ${fieldName} - Contains ${req.files[fieldName].length} file(s)`);
       }
   } else {
       console.log('No files in req.files');
   }
   
   try {
       let response=await geocodingClient.forwardGeocode({
         query: req.body.listing.location,
         limit: 1
       })
      .send();
      
       // Handle file uploads from upload.fields()
       let mainImage = {};
       let additionalImages = [];
       let uploadedImageFilenames = []; // Track uploaded filenames for cleanup
       
       if (req.files && Object.keys(req.files).length > 0) {
           // Handle main image
           const mainImageField = 'image';
           if (req.files[mainImageField] && req.files[mainImageField].length > 0) {
               const mainImageFile = req.files[mainImageField][0];
               mainImage = {
                   url: mainImageFile.path,
                   filename: mainImageFile.filename
               };
               uploadedImageFilenames.push(mainImageFile.filename);
               console.log('Main image processed:', mainImageFile.originalname);
           } else {
               console.log('No main image file found in field:', mainImageField);
           }
           
           // Handle additional images
           const additionalImagesField = 'additionalImages';
           if (req.files[additionalImagesField] && req.files[additionalImagesField].length > 0) {
               additionalImages = req.files[additionalImagesField].map(file => {
                   uploadedImageFilenames.push(file.filename);
                   return {
                       url: file.path,
                       filename: file.filename
                   };
               });
               console.log('Additional images processed:', req.files[additionalImagesField].length);
           } else {
               console.log('No additional images found in field:', additionalImagesField);
           }
       } else {
           console.log('No files received in controller');
       }
       
    const newListing = new Listing(req.body.listing); 
    newListing.owner = req.user._id;
        newListing.image = mainImage;
        newListing.additionalImages = additionalImages;
        newListing.geometry = response.body.features[0].geometry;
        
       // Mirror accommodates to houseRules.maxGuests if provided
       if (typeof newListing.accommodates === 'number' && newListing.accommodates > 0) {
           newListing.houseRules = newListing.houseRules || {};
           newListing.houseRules.maxGuests = newListing.accommodates;
       }
       
       let savedlist= await newListing.save(); 
       console.log('New listing saved:', savedlist.title);
    req.flash("success","New listing created");
    res.redirect("/listings");
   } catch (error) {
       console.error('Error creating listing:', error);
       
       // If there was an error and images were uploaded, delete them from Cloudinary
       if (uploadedImageFilenames.length > 0) {
           try {
               console.log('Deleting uploaded images due to error:', uploadedImageFilenames);
               const deletionResults = await deleteImagesFromCloudinary(uploadedImageFilenames);
               console.log('Cloudinary deletion results:', deletionResults);
               
               if (deletionResults.failed.length > 0) {
                   console.error('Some images failed to delete from Cloudinary:', deletionResults.failed);
               }
           } catch (deleteError) {
               console.error('Error deleting images from Cloudinary:', deleteError);
           }
       }
       
       req.flash("error", "Error creating listing: " + error.message);
       res.redirect("/listings/new");
   }
};

module.exports.rendoreditform = async (req,res)=>{
    let {id} = req.params;
    const listdata = await Listing.findById(id);
    if(!listdata){
        req.flash("error","list does not exist");
        res.redirect("/listings");
    }
    let originalimageurl = listdata.image && listdata.image.url ? listdata.image.url : "";
    if (originalimageurl) {
        originalimageurl = originalimageurl.replace("/upload","/upload/w_300");
    }
    
    // Process additional images for display
    let additionalImagesUrls = [];
    if (listdata.additionalImages && listdata.additionalImages.length > 0) {
        additionalImagesUrls = listdata.additionalImages.map(img => 
            img.url ? img.url.replace("/upload","/upload/w_300") : ""
        );
    }
    
    res.render("listings/edit.ejs",{listdata, originalimageurl, additionalImagesUrls});
};

module.exports.updatelisting = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('\n\n===== UPDATE LISTING START - COMPLETE DEBUG =====');
        console.log('Updating listing with ID:', id);
        console.log('Request method:', req.method);
        console.log('Request body fields:', Object.keys(req.body));
        console.log('Request body replace_images flag:', req.body.replace_images);
        console.log('Request files:', req.files ? 'Present' : 'None');
        
        // Log detailed file information
        if (req.files) {
            console.log('Files received details:');
            Object.keys(req.files).forEach(fieldName => {
                console.log(`- Field ${fieldName}: ${req.files[fieldName].length} file(s)`);
                req.files[fieldName].forEach((f, i) => {
                    console.log(`  File ${i+1}: ${f.originalname} (${Math.round(f.size/1024)}KB)`);
                });
            });
        } else {
            console.log('No files received in request');
        }

        // Get the existing listing with all current images
        console.log('\nFinding listing by ID...');
        const listing = await Listing.findById(id);
        if (!listing) {
            console.log('ERROR: Listing not found');
            req.flash('error', 'Listing not found');
            return res.redirect('/listings');
        }
        
        console.log('Found listing:', listing.title);
        console.log('Current images state:');
        console.log('- Main image:', listing.image ? 'Present' : 'None');
        console.log('- Additional images count:', listing.additionalImages ? listing.additionalImages.length : 0);
        
        if (listing.additionalImages && listing.additionalImages.length > 0) {
            console.log('  Additional image details:');
            listing.additionalImages.forEach((img, i) => {
                console.log(`  Image ${i+1}: ${img.filename || 'no filename'}`);
            });
        }

        // CRITICAL: Handle additional images replacement properly
        // Check if new additional images are being uploaded
        const hasNewAdditionalImages = req.files && req.files.additionalImages && req.files.additionalImages.length > 0;
        
        // Store old additional image filenames for deletion
        let oldAdditionalImageFilenames = [];
        if (hasNewAdditionalImages && listing.additionalImages && listing.additionalImages.length > 0) {
            oldAdditionalImageFilenames = listing.additionalImages.map(img => img.filename).filter(filename => filename);
            console.log('Old additional image filenames to delete:', oldAdditionalImageFilenames);
        }
        
        if (hasNewAdditionalImages) {
            console.log('\n!!! CRITICAL - REPLACING ALL ADDITIONAL IMAGES !!!');
            console.log('New additional images detected - COMPLETELY REPLACING existing images');
            console.log('Previous additional images count:', listing.additionalImages ? listing.additionalImages.length : 0);
            
            // Create a completely new empty array for additional images
            const newAdditionalImages = [];
            
            // Process all new additional images
            req.files.additionalImages.forEach((file) => {
                newAdditionalImages.push({
                    url: file.path,
                    filename: file.filename
                });
                console.log(`Added new image: ${file.filename}`);
            });
            
            // Completely replace the existing additionalImages array
            listing.additionalImages = newAdditionalImages;
            
            console.log('New additional images count:', listing.additionalImages.length);
            console.log('New image details:');
            listing.additionalImages.forEach((img, i) => {
                console.log(`  Image ${i+1}: ${img.filename || 'no filename'}`);
            });
        } else {
            console.log('No new additional images uploaded - keeping existing ones');
        }

        // Handle main image replacement
        const hasNewMainImage = req.files && req.files.image && req.files.image.length > 0;
        let oldMainImageFilename = null;
        
        if (hasNewMainImage && listing.image && listing.image.filename) {
            oldMainImageFilename = listing.image.filename;
            console.log('Old main image filename to delete:', oldMainImageFilename);
        }
        
        // Process form data
        if (req.body.listing) {
            console.log('\nProcessing form data...');
            // Handle basic fields directly
            const updateFields = [
                'title', 'description', 'price',
                'accommodates', 'propertyType', 'bedrooms', 'bathrooms', 'beds', 'category'
            ];

            updateFields.forEach(field => {
                if (req.body.listing[field] !== undefined) {
                    listing[field] = req.body.listing[field];
                }
            });
            
            // Handle location change - update geometry if location changes
            if (req.body.listing.location && req.body.listing.location !== listing.location) {
                console.log('Location changed, updating geometry...');
                try {
                    // Check if geocoding client is available
                    if (!geocodingClient) {
                        console.log('Geocoding client not available, skipping geometry update');
                        listing.location = req.body.listing.location;
                    } else {
                        const response = await geocodingClient.forwardGeocode({
                            query: req.body.listing.location,
                            limit: 1
                        }).send();
                        
                        if (response.body.features && response.body.features.length > 0) {
                            listing.geometry = response.body.features[0].geometry;
                            console.log('Geometry updated successfully');
                        }
                        listing.location = req.body.listing.location;
                    }
                } catch (geoError) {
                    console.error('Geocoding error:', geoError);
                    listing.location = req.body.listing.location;
                }
            }
            
            // Update country if provided
            if (req.body.listing.country) {
                listing.country = req.body.listing.country;
            }

            // Handle amenities separately (it might be a single value or array)
            if (req.body.listing.amenities) {
                listing.amenities = Array.isArray(req.body.listing.amenities) 
                    ? req.body.listing.amenities 
                    : [req.body.listing.amenities];
            }

            // Handle nested objects
            if (req.body.listing.houseRules) {
                listing.houseRules = { ...listing.houseRules || {}, ...req.body.listing.houseRules };
            }

            if (req.body.listing.availability) {
                listing.availability = { ...listing.availability || {}, ...req.body.listing.availability };
            }

            // Sync accommodates with maxGuests
            if (req.body.listing.accommodates) {
                const acc = Number(req.body.listing.accommodates);
                if (!isNaN(acc) && acc > 0) {
                    if (!listing.houseRules) listing.houseRules = {};
                    listing.houseRules.maxGuests = acc;
                }
            }
        }

        // Handle main image separately (if provided)
        if (hasNewMainImage) {
            console.log('\nUpdating main image...');
            const mainImageFile = req.files.image[0];
            console.log('New main image:', mainImageFile.originalname);
            
            listing.image = {
                url: mainImageFile.path,
                filename: mainImageFile.filename
            };
            
            console.log('Main image updated successfully');
        }

        // Ensure geometry exists to prevent validation errors
        if (!listing.geometry) {
            console.log('\nNo geometry found, setting default');
            listing.geometry = {
                type: 'Point',
                coordinates: [0, 0] // Default coordinates if none exist
            };
        }

        // Save the updated listing
        console.log('\nPreparing to save updated listing...');
        console.log('Final additional images count before save:', listing.additionalImages.length);
        
        if (listing.additionalImages && listing.additionalImages.length > 0) {
            console.log('Final additional images details before save:');
            listing.additionalImages.forEach((img, i) => {
                console.log(`  Image ${i+1}: ${img.filename || 'no filename'}`);
            });
        }
        
        // Force Mongoose to recognize the change to additionalImages array
        if (hasNewAdditionalImages || hasNewMainImage) {
            if (hasNewAdditionalImages) {
                listing.markModified('additionalImages');
                console.log('Explicitly marked additionalImages as modified');
            }
            if (hasNewMainImage) {
                listing.markModified('image');
                console.log('Explicitly marked image as modified');
            }
        }
        
        // Save with updated options to force a proper update
        const savedListing = await listing.save({ validateModifiedOnly: true });
        
        console.log('\nListing saved successfully');
        console.log('Final additional images count after save:', savedListing.additionalImages.length);
        
        if (savedListing.additionalImages && savedListing.additionalImages.length > 0) {
            console.log('Final additional images details after save:');
            savedListing.additionalImages.forEach((img, i) => {
                console.log(`  Image ${i+1}: ${img.filename || 'no filename'}`);
            });
        }
        
        // Now delete the old images from Cloudinary after successful save
        const imagesToDelete = [];
        if (oldMainImageFilename) {
            imagesToDelete.push(oldMainImageFilename);
        }
        if (oldAdditionalImageFilenames.length > 0) {
            imagesToDelete.push(...oldAdditionalImageFilenames);
        }
        
        if (imagesToDelete.length > 0) {
            try {
                console.log('Deleting old images from Cloudinary:', imagesToDelete);
                const deletionResults = await deleteImagesFromCloudinary(imagesToDelete);
                console.log('Cloudinary deletion results:', deletionResults);
                
                if (deletionResults.failed.length > 0) {
                    console.error('Some images failed to delete from Cloudinary:', deletionResults.failed);
                }
            } catch (deleteError) {
                console.error('Error deleting old images from Cloudinary:', deleteError);
            }
        }
        
        console.log('===== UPDATE LISTING SUCCESS =====\n\n');
        req.flash('success', 'Listing updated successfully');
        return res.redirect(`/listings/${id}`);

    } catch (err) {
        console.error('===== UPDATE LISTING ERROR =====');
        console.error('Error details:', err);
        console.error('Error stack:', err.stack);
        req.flash('error', `Error updating listing: ${err.message}`);
        // Redirect back to edit form instead of listings page
        return res.redirect(`/listings/${id}/edit`);
    }
};

// Delete individual additional image
module.exports.deleteAdditionalImage = async (req, res) => {
    try {
        const { id, imageIndex } = req.params;
        const listing = await Listing.findById(id);
        
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }
        
        if (!req.user._id.equals(listing.owner)) {
            req.flash("error", "You don't have permission");
            return res.redirect(`/listings/${id}`);
        }
        
        // Check if the image exists
        if (listing.additionalImages && listing.additionalImages[imageIndex]) {
            // Get the filename before deleting
            const imageToDelete = listing.additionalImages[imageIndex];
            const filename = imageToDelete.filename;
            
            // Remove from array
            listing.additionalImages.splice(imageIndex, 1);
            await listing.save();
            
            // Delete from Cloudinary
            if (filename) {
                try {
                    const deletionResults = await deleteImagesFromCloudinary([filename]);
                    if (deletionResults.failed.length > 0) {
                        console.error('Failed to delete image from Cloudinary:', deletionResults.failed);
                    } else {
                        console.log(`Successfully deleted image ${filename} from Cloudinary`);
                    }
                } catch (deleteError) {
                    console.error(`Error deleting image ${filename} from Cloudinary:`, deleteError);
                }
            }
            
            req.flash("success", "Image deleted successfully");
        } else {
            req.flash("error", "Image not found");
        }
        
        res.redirect(`/listings/${id}/edit`);
    } catch (error) {
        console.error("Delete image error:", error);
        req.flash("error", "Failed to delete image");
        res.redirect("/listings");
    }
};

module.exports.deletelisting = async (req,res)=>{
    if(!req.user) {
        req.flash("error", "You must be logged in to delete a listing");
        return res.redirect("/login");
    }
    
    try {
    let {id}=req.params;
        const listing = await Listing.findById(id);
        
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }
        
        // Collect all image filenames to delete from Cloudinary
        const imagesToDelete = [];
        
        // Add main image if it exists
        if (listing.image && listing.image.filename) {
            imagesToDelete.push(listing.image.filename);
        }
        
        // Add additional images if they exist
        if (listing.additionalImages && listing.additionalImages.length > 0) {
            listing.additionalImages.forEach(img => {
                if (img.filename) {
                    imagesToDelete.push(img.filename);
                }
            });
        }
        
        // Delete the listing from database
        let deletedListing = await Listing.findByIdAndDelete(id);
        if(!deletedListing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }
        
        // Delete all images from Cloudinary
        if (imagesToDelete.length > 0) {
            try {
                console.log('Deleting images from Cloudinary:', imagesToDelete);
                const deletionResults = await deleteImagesFromCloudinary(imagesToDelete);
                console.log('Cloudinary deletion results:', deletionResults);
                
                if (deletionResults.failed.length > 0) {
                    console.error('Some images failed to delete from Cloudinary:', deletionResults.failed);
                }
            } catch (deleteError) {
                console.error('Error deleting images from Cloudinary:', deleteError);
            }
        }
        
    req.flash("success","listing Deleted");
    res.redirect("/listings");
    } catch (error) {
        console.error("Delete listing error:", error);
        req.flash("error", "Failed to delete listing");
        res.redirect("/listings");
    }
};

module.exports.searchListings = async (req, res) => {
    let query = req.query.q;
    if (!query) {
        return res.redirect("/listings");
    }

    const listings = await Listing.find({
        $or: [
            { country: { $regex: query, $options: "i" } },
            { location: { $regex: query, $options: "i" } },
            { title: { $regex: query, $options: "i" } }
        ]
    });

    res.render("listings/index.ejs", { allist: listings });
};