// Load environment variables first
if(process.env.NODE_ENV != "production"){
    require("dotenv").config({quiet:true});
}

const connectDB = require('./config/database.js');

// Connect to database
connectDB().then(async () => {
    const Booking = require('./models/booking.js');
    const Listing = require('./models/listing.js');
    
    const listing = await Listing.findOne({ title: { $regex: /palm island/i } });
    if (!listing) {
        console.log('Palm Island listing not found');
        process.exit(1);
    }
    
    console.log('Found Palm Island listing:', listing.title, listing._id);
    
    const checkInDate = new Date('2025-09-01');
    const checkOutDate = new Date('2025-09-02');
    
    const bookings = await Booking.find({
        listing: listing._id,
        checkIn: { $lt: checkOutDate },
        checkOut: { $gt: checkInDate }
    });
    
    console.log('Bookings overlapping with 2025-09-01 to 2025-09-02:', bookings.length);
    for (const b of bookings) {
        console.log('  - ID:', b._id);
        console.log('    Dates:', b.checkIn.toISOString().split('T')[0], 'to', b.checkOut.toISOString().split('T')[0]);
        console.log('    Status:', b.status);
        console.log('    Guest:', b.guest);
        console.log('    Nights:', b.nights);
        console.log('    Total:', b.total);
    }
    
    // Also check availability using the model method
    const isAvailable = await Booking.checkAvailability(listing._id, checkInDate, checkOutDate);
    console.log('\nAvailability check result:', isAvailable ? '✅ Available' : '❌ Not available');
    
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});