import express from "express";
import {
    authMe,
    submitProviderApplication,
    updateGamingProfile,
    updatePlayerListing,
    updateProfile,
    updateProviderStudio,
    walletTopUp,
} from "../Controllers/userController.js";
import { protectedRoute } from "../middlewares/authmiddle.js";

const router = express.Router();

router.get("/me", protectedRoute, authMe);
router.patch("/profile", protectedRoute, updateProfile);
router.patch("/gaming-profile", protectedRoute, updateGamingProfile);
router.patch("/player-listing", protectedRoute, updatePlayerListing);
router.patch("/provider-studio", protectedRoute, updateProviderStudio);
router.post("/wallet/top-up", protectedRoute, walletTopUp);
router.post("/provider-application", protectedRoute, submitProviderApplication);

export default router;
