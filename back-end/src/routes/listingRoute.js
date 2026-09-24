import express from "express";
import { getLeaderboard, getListings, getSocialLeaderboards } from "../Controllers/listingController.js";

const router = express.Router();

router.get("/leaderboards", getSocialLeaderboards);
router.get("/leaderboard", getLeaderboard);
router.get("/", getListings);

export default router;
