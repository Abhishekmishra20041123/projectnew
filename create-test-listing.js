const mongoose = require('mongoose');
const Listing = require('./models/listing.js');
const User = require('./models/user.js');

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find a user to use as owner
    const user = await User.findOne();
    if (!user) {
      console.log('No users found in database');
      process.exit(1);
    }
    
    console.log('Using user:', user.username, user._id);
    
    // Create a test listing
    const listing = new Listing({
      title: 'Test Listing for Booking',
      description: 'This is a test listing created for booking testing purposes',
      image: {
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        filename: 'test_listing'
      },
      price: 100,
      location: 'Test City',
      country: 'Test Country',
      geometry: {
        type: 'Point',
        coordinates: [0, 0] // Default coordinates
      },
      owner: user._id,
      propertyType: 'Entire place',
      accommodates: 4,
      category: 'Trending' // Use a valid category from the enum
    });
    
    try {
      await listing.save();
      console.log('Test listing created successfully!');
      console.log('Listing ID:', listing._id);
      console.log('Title:', listing.title);
      
      process.exit(0);
    } catch (error) {
      console.error('Error creating listing:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });