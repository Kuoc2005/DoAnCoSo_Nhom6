import express from "express";
import { getPublicPlayer } from "../Controllers/playerPublicController.js";

const router = express.Router();

router.get("/:username", getPublicPlayer);

export default router;
