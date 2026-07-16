import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, updateProfile } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(upload.single("avatar"), registerUser);
router.route("/login").post(loginUser);

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/profile").put(verifyJWT, upload.single("avatar"), updateProfile);

// OAuth Routes
import passport from "passport";
import { oauthCallback } from "../controllers/user.controller.js";

// Google
router.get("/auth/google", passport.authenticate("google", { session: false }));
router.get("/auth/google/callback", passport.authenticate("google", { session: false, failureRedirect: "/login" }), oauthCallback);

// GitHub
router.get("/auth/github", passport.authenticate("github", { session: false }));
router.get("/auth/github/callback", passport.authenticate("github", { session: false, failureRedirect: "/login" }), oauthCallback);

export default router;