import express from "express";
<<<<<<< HEAD
import { getSuggestions, getTaxonomy, postMatchAssistant, getRecommendedTeammates } from "../Controllers/matchController.js";
=======
import { getSuggestions, getTaxonomy, postMatchAssistant } from "../Controllers/matchController.js";
>>>>>>> 667b488a894bc37051b38ff9dafa8d98652a29a7
import { protectedRoute } from "../middlewares/authmiddle.js";

const router = express.Router();

router.get("/taxonomy", getTaxonomy);
router.get("/suggestions", protectedRoute, getSuggestions);
router.post("/assistant", protectedRoute, postMatchAssistant);
<<<<<<< HEAD
router.get("/teammates", protectedRoute, getRecommendedTeammates);
=======

>>>>>>> 667b488a894bc37051b38ff9dafa8d98652a29a7
export default router;
