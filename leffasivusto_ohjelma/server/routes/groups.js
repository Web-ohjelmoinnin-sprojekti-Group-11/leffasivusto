// server/routes/groups.js
import express from "express";
import { verifyJWT } from "../middleware/auth.js";
import { create, listAll, listMine, getOne, remove } from "../controllers/groupController.js";

const router = express.Router();

/* Create group (transaction) */
router.post("/", verifyJWT, create);

/* List all groups (public) */
router.get("/", listAll);

/* My groups (must be BEFORE '/:id') */
router.get("/mine", verifyJWT, listMine);

/* Get single group (members only) */
router.get("/:id", verifyJWT, getOne);

/* Delete group (owner only) */
router.delete("/:id", verifyJWT, remove);

export default router;
