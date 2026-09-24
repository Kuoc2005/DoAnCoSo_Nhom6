import express from "express";
import { createReview, listReviewsForPlayer } from "../Controllers/reviewController.js";
import { protectedRoute } from "../middlewares/authmiddle.js";

const router = express.Router();

router.get("/player/:username", listReviewsForPlayer);
router.post("/", protectedRoute, createReview);

export default router;
