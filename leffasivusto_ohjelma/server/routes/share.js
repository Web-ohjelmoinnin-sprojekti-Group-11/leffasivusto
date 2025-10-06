import express from "express";
import { viewSharedFavorites } from "../controllers/favoriteShareController.js";

const router = express.Router();
// Public: ei authia
router.get("/:token", viewSharedFavorites);

export default router;
