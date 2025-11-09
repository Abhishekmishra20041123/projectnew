/**
 * Script to check if a user is an admin
 * Usage: node check-admin.js <username>
 */

const mongoose = require("mongoose");
require("dotenv").config({ quiet: true });
const User = require("./models/user.js");
const connectDB = require("./config/database.js");

async function checkAdmin() {
    try {
        await connectDB();
        console.log("Connected to database\n");

        const username = process.argv[2] || "Admin";

        // Try exact match first
        let user = await User.findOne({ username: username });
        
        // If not found, try case-insensitive search
        if (!user) {
            user = await User.findOne({ 
                username: { $regex: new RegExp(`^${username}$`, 'i') } 
            });
        }

        if (!user) {
            console.error(`❌ User with username "${username}" not found`);
            console.log("\nAvailable users:");
            const allUsers = await User.find({}, { username: 1, email: 1, isAdmin: 1 });
            allUsers.forEach(u => {
                console.log(`  - ${u.username} (${u.email}) - Admin: ${u.isAdmin}`);
            });
            process.exit(1);
        }

        console.log("✅ User found:");
        console.log(`  - Username: ${user.username}`);
        console.log(`  - Email: ${user.email}`);
        console.log(`  - isAdmin: ${user.isAdmin}`);
        console.log(`  - isAdmin type: ${typeof user.isAdmin}`);
        console.log(`  - isAdmin === true: ${user.isAdmin === true}`);
        console.log(`  - isAdmin == true: ${user.isAdmin == true}`);
        console.log(`  - Boolean(user.isAdmin): ${Boolean(user.isAdmin)}`);

        if (user.isAdmin) {
            console.log("\n✅ User IS an admin");
        } else {
            console.log("\n❌ User is NOT an admin");
            console.log("To make this user an admin, run:");
            console.log(`  node make-admin.js ${user.username}`);
        }

        process.exit(0);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

checkAdmin();



