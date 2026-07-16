import mongoose from 'mongoose';
import { User } from './src/models/user.model.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.ENV' });
import { redisClient } from './src/utils/redis.js';

const generateAccessAndRefreshTokens = async (userId, userInstance = null) => {
    try {
        const user = userInstance || await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        await redisClient.set(`user:${userId}:refreshToken`, refreshToken, "EX", 7 * 24 * 60 * 60);

        return { accessToken, refreshToken };
    } catch (error) {
        console.error("DEBUG ERROR:", error);
        throw error;
    }
};

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Simulate OAuth user creation
        const newUser = await User.create({
            fullName: "Test OAuth",
            email: "testoauth@example.com",
            authProvider: "google",
            googleId: "123456789",
            isEmailVerified: true
        });

        console.log("User created:", newUser._id);

        await generateAccessAndRefreshTokens(newUser._id, newUser);
        
        console.log("Tokens generated successfully!");

        // Cleanup
        await User.deleteOne({ _id: newUser._id });
        process.exit(0);
    } catch (err) {
        console.error("TEST FAILED:", err);
        process.exit(1);
    }
}

test();
