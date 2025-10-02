// server/routes/user.js
import express from "express";
import { verifyJWT } from "../middleware/auth.js";

import {
  getFavoritesCtrl,
  addFavoriteCtrl,
  removeFavoriteCtrl,
  listMyReviewsCtrl,
  deleteMyReviewCtrl,
  listHistoryCtrl,
  listWatchLaterCtrl,
  addWatchLaterCtrl,
  removeWatchLaterCtrl,
} from "../controllers/userController.js";

const router = express.Router();

// Kaikki alla vaativat autentikaation
router.use(verifyJWT);

/* Favorites */
router.get("/favorites", getFavoritesCtrl);
router.post("/favorites", addFavoriteCtrl);
router.delete("/favorites/:movieId", removeFavoriteCtrl);

/* Reviews */
router.get("/reviews", listMyReviewsCtrl);
router.delete("/reviews/:id", deleteMyReviewCtrl);

/* History */
router.get("/history", listHistoryCtrl);

/* Watch later */
router.get("/watch-later", listWatchLaterCtrl);
router.post("/watch-later", addWatchLaterCtrl);
router.delete("/watch-later/:movieId", removeWatchLaterCtrl);

export default router;
