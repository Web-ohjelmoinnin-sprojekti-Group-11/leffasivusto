// server/routes/groupContent.js
import express from "express";
import { verifyJWT } from "../middleware/auth.js";
import { addMovieToGroup, getGroupMovies } from "../controllers/groupContentController.js";

const router = express.Router();

router.post("/:groupId/movies", verifyJWT, addMovieToGroup);
router.get("/:groupId/movies", verifyJWT, getGroupMovies);

export default router;
