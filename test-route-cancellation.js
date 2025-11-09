const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const User = require('./models/user.js');
const bookingRouter = require('./routes/booking.js');

// Create a simple express app for testing
const app = express();

// Session setup (required for the routes)
const store = MongoStore.create({
    mongoUrl: "mongodb://127.0.0.1:27017/wanderlust",
    crypto: {
        secret: "mysecretcode"
    },
    touchAfter: 24 * 3600
});

const sessionOption = {
    store,
    secret: "mysecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
};

app.use(session(sessionOption));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Mock authentication middleware
const mockUser = {
    _id: '688602dbf7dc9c2b4d09fd7f', // The user ID we found earlier
    username: 'student',
    isAuthenticated: () => true
};

// Mock the isloggedin middleware
const mockIsLoggedIn = (req, res, next) => {
    req.user = mockUser;
    req.isAuthenticated = () => true;
    next();
};

// Apply the mock middleware to all routes
app.use('/bookings', mockIsLoggedIn, bookingRouter);

// Test the cancellation route
app.post('/test-cancel-booking/:id', async (req, res) => {
    try {
        // Make a request to the actual cancel route
        const testReq = {
            params: { id: req.params.id },
            user: mockUser,
            isAuthenticated: () => true
        };
        
        const testRes = {
            redirect: (url) => {
                console.log('Redirected to:', url);
                res.json({ success: true, redirectUrl: url });
            },
            flash: (type, message) => {
                console.log('Flash message:', type, message);
            }
        };
        
        // Call the route handler directly
        // We'll simulate this by calling the route through our test app
        res.redirect(`/bookings/${req.params.id}/cancel`);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
const server = app.listen(3001, async () => {
    console.log('Test server running on port 3001');
    
    // Test the cancellation
    try {
        const bookingId = '68b35fa0bc54fb8dcc384865'; // Our test booking ID
        console.log('Testing cancellation for booking:', bookingId);
        
        // Make a POST request to test the cancellation
        const http = require('http');
        const postData = '';
        
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: `/bookings/${bookingId}/cancel`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('Response status:', res.statusCode);
                console.log('Response headers:', res.headers);
                console.log('Response body:', data);
                server.close();
                process.exit(0);
            });
        });
        
        req.on('error', (error) => {
            console.error('Request error:', error);
            server.close();
            process.exit(1);
        });
        
        req.write(postData);
        req.end();
    } catch (error) {
        console.error('Test error:', error);
        server.close();
        process.exit(1);
    }
});