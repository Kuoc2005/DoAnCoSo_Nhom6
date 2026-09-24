import express from "express";
import { protectedRoute } from "../middlewares/authmiddle.js";
import { getMySupportThread, postMySupportMessage } from "../Controllers/supportMessageController.js";
import {
    getDirectThread,
    listMyConversations,
    postDirectMessage,
} from "../Controllers/directMessageController.js";

const router = express.Router();

router.get("/conversations", protectedRoute, listMyConversations);
router.get("/direct/:otherUserId", protectedRoute, getDirectThread);
router.post("/direct", protectedRoute, postDirectMessage);

router.get("/support", protectedRoute, getMySupportThread);
router.post("/support", protectedRoute, postMySupportMessage);

export default router;
