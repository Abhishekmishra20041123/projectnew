/**
 * Utility script to make a user an admin
 * Usage: node make-admin.js <username>
 */

const mongoose = require("mongoose");
require("dotenv").config({ quiet: true });
const User = require("./models/user.js");

// Connect to database
const connectDB = require("./config/database.js");

async function makeAdmin() {
    try {
        // Connect to database
        await connectDB();
        console.log("Connected to database");

        // Get username from command line arguments
        const username = process.argv[2];

        if (!username) {
            console.error("Error: Please provide a username");
            console.log("Usage: node make-admin.js <username>");
            process.exit(1);
        }

        // Find user by username
        const user = await User.findOne({ username: username });

        if (!user) {
            console.error(`Error: User with username "${username}" not found`);
            process.exit(1);
        }

        // Check if user is already an admin
        if (user.isAdmin) {
            console.log(`User "${username}" is already an admin`);
            process.exit(0);
        }

        // Make user an admin
        user.isAdmin = true;
        await user.save();

        console.log(`✅ Successfully made user "${username}" an admin`);
        console.log(`User details:`);
        console.log(`  - Username: ${user.username}`);
        console.log(`  - Email: ${user.email}`);
        console.log(`  - Admin: ${user.isAdmin}`);

        process.exit(0);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

// Run the function
makeAdmin();



