import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { redisClient } from "../utils/redis.js";
// --- ZOD SCHEMAS (PRD: AUTH-01) ---
const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"), 
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Helper to generate tokens
const generateAccessAndRefreshTokens = async (userId, userInstance = null) => {
    try {
        const user = userInstance || await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        // Cache the newly generated refresh token (7 days)
        await redisClient.set(`user:${userId}:refreshToken`, refreshToken, "EX", 7 * 24 * 60 * 60);

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens");
    }
};

// --- CONTROLLERS ---

export const registerUser = asyncHandler(async (req, res) => {
  // 1. Zod Validation
  const validationResult = registerSchema.safeParse(req.body);
  if (!validationResult.success) {
    const errors = validationResult.error.issues.map((err) => err.message);
    throw new ApiError(400, "Validation failed", errors);
  }

  const { fullName, email, password } = validationResult.data;

  // 2. Check if user exists
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // 3. Create User (password gets hashed automatically by our hook!)
  const user = await User.create({
    fullName,
    email,
    password,
  });

  // Remove password and refreshToken from the response
  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
});


export const loginUser = asyncHandler(async (req, res) => {
  // 1. Zod Validation
  const validationResult = loginSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw new ApiError(400, "Validation failed", validationResult.error.issues);
  }

  const { email, password } = validationResult.data;

  // 2. Find User
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // 3. Check Password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // 4. Generate Tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id, user);
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  // Cache user profile for fast API access
  await redisClient.set(`user:${user._id}:profile`, JSON.stringify(loggedInUser), "EX", 24 * 60 * 60);

  // 5. Send in httpOnly cookies (PRD: AUTH-02)
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // to make them work on Http in development
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
    // Clear Redis Cache
    await redisClient.del(`user:${req.user._id}:refreshToken`);
    await redisClient.del(`user:${req.user._id}:profile`);

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        
        let userInstance = null;

        // FAST PATH: Check Redis Cache First
        const cachedRefreshToken = await redisClient.get(`user:${decodedToken._id}:refreshToken`);
        
        if (cachedRefreshToken) {
            if (incomingRefreshToken !== cachedRefreshToken) {
                throw new ApiError(401, "Refresh token is expired or used (Redis)");
            }
        } else {
            // SLOW PATH: DB Fallback
            userInstance = await User.findById(decodedToken?._id);

            if (!userInstance) {
                throw new ApiError(401, "Invalid refresh token");
            }

            if (incomingRefreshToken !== userInstance?.refreshToken) {
                throw new ApiError(401, "Refresh token is expired or used");
            }
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        };

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(decodedToken._id, userInstance);

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken }, 
                "Access token refreshed"
            )
        );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});