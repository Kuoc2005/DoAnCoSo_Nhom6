import express from "express";
import { quickRent } from "../Controllers/rentalController.js";
import { protectedRoute } from "../middlewares/authmiddle.js";

const router = express.Router();

router.post("/quick", protectedRoute, quickRent);

export default router;
