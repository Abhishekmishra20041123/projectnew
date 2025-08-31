const mongoose = require("mongoose");

const atlasURL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function connectDB() {
    try {
        console.log("🌍 Connecting to MongoDB Atlas...");
        await mongoose.connect(atlasURL, {
            serverSelectionTimeoutMS: 20000,
            ssl: true,
            tlsAllowInvalidCertificates: true // Fixes TLS handshake errors
        });
        console.log("✅ Connected to MongoDB Atlas");
    } catch (err) {
        console.error("⚠️ MongoDB Atlas connection failed:", err.message);
        console.log("🔄 Trying Local MongoDB...");
        try {
            await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
            console.log("✅ Connected to Local MongoDB");
        } catch (localErr) {
            console.error("❌ Local MongoDB connection failed:", localErr.message);
            process.exit(1);
        }
    }
}
module.exports = connectDB;
