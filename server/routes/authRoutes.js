import express from "express";
import {
    handleGitHubOAuth,
    handleGoogleOAuth,
    loginUser,
    registerUser,
    startGitHubOAuth,
    startGoogleOAuth,
    forgotPassword,
    resetPassword,
    updateProfile,
    getProfile,
    aiChat,
    deleteAccount
} from "../controllers/authControllers.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/google", startGoogleOAuth);
router.get("/google/callback", handleGoogleOAuth);
router.get("/github", startGitHubOAuth);
router.get("/github/callback", handleGitHubOAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.delete("/profile", protect, deleteAccount);
router.post("/ai-chat", protect, aiChat);

export default router;
