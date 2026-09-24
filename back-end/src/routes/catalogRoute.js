import express from "express";
import { getHomeCatalog } from "../Controllers/catalogController.js";

const router = express.Router();

router.get("/home", getHomeCatalog);

export default router;
