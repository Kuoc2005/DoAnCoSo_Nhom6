import express from "express";
import { getSuggestions, getTaxonomy, postMatchAssistant, getRecommendedTeammates } from "../Controllers/matchController.js";
import { protectedRoute } from "../middlewares/authmiddle.js";

const router = express.Router();

router.get("/taxonomy", getTaxonomy);
router.get("/suggestions", protectedRoute, getSuggestions);
router.post("/assistant", protectedRoute, postMatchAssistant);
router.get("/teammates", protectedRoute, getRecommendedTeammates);
export default router;
