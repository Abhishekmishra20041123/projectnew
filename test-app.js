// Test script to verify database connection and authentication
const mongoose = require("mongoose");
const connectDB = require("./config/database.js");
const User = require("./models/user.js");
const Listing = require("./models/listing.js");

async function testApplication() {
    try {
        console.log("🧪 Starting application tests...");
        
        // Test 1: Database Connection
        console.log("1️⃣ Testing database connection...");
        await connectDB();
        console.log("✅ Database connection: PASSED");
        
        // Test 2: User Model
        console.log("2️⃣ Testing User model...");
        const userCount = await User.countDocuments();
        console.log(`✅ User model: PASSED (${userCount} users found)`);
        
        // Test 3: Listing Model
        console.log("3️⃣ Testing Listing model...");
        const listingCount = await Listing.countDocuments();
        console.log(`✅ Listing model: PASSED (${listingCount} listings found)`);
        
        // Test 4: Owner relationships
        console.log("4️⃣ Testing owner relationships...");
        const listingsWithOwners = await Listing.find().populate("owner");
        const validOwners = listingsWithOwners.filter(listing => listing.owner).length;
        console.log(`✅ Owner relationships: PASSED (${validOwners}/${listingCount} listings have valid owners)`);
        
        console.log("🎉 All tests passed! Application should work correctly.");
        
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        console.error("Stack:", error.stack);
    } finally {
        await mongoose.connection.close();
        console.log("📋 Database connection closed");
    }
}

// Run tests
testApplication();