const express = require('express');
const app = express();
const bookingRouter = require('./routes/booking.js');

// Mock Passport.js isAuthenticated function
const mockIsLoggedIn = (req, res, next) => {
  // Mock isAuthenticated function from Passport.js
  req.isAuthenticated = () => true;
  // Mock a user object for testing
  req.user = {
    _id: 'test-user-id',
    username: 'testuser'
  };
  next();
};

// Mock flash function
app.use((req, res, next) => {
  req.flash = (type, message) => {
    console.log(`${type}: ${message}`);
  };
  next();
});

// Mock session
app.use((req, res, next) => {
  req.session = {};
  next();
});

// Apply mock middleware to all routes
app.use(mockIsLoggedIn);

// Mount the booking router
app.use('/bookings', bookingRouter);

// Start server on a different port for testing
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Test the route at: http://localhost:3001/bookings/my-bookings');
});