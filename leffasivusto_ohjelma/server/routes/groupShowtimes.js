// server/routes/groupShowtimes.js
import express from "express";
import { verifyJWT } from "../middleware/auth.js";
import {
  getMine,
  getByGroup,
  create,
} from "../controllers/groupShowtimeController.js";

const router = express.Router();

/**
 * HUOM: /mine pitää olla ennen "/:groupId"
 */
router.get("/mine", verifyJWT, getMine);
router.get("/:groupId", verifyJWT, getByGroup);
router.post("/:groupId", verifyJWT, create);

export default router;
