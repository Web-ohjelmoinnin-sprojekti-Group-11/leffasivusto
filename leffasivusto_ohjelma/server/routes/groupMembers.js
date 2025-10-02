// server/routes/groupMembers.js
import express from "express";
import { verifyJWT } from "../middleware/auth.js";
import {
  join,
  handleRequest,
  leave,
  removeMember,
  list,
} from "../controllers/groupMemberController.js";

const router = express.Router();

router.post("/:groupId/join", verifyJWT, join);
router.post("/:groupId/requests/:userId", verifyJWT, handleRequest);
router.delete("/:groupId/leave", verifyJWT, leave);
router.delete("/:groupId/members/:userId", verifyJWT, removeMember);
router.get("/:groupId", verifyJWT, list);

export default router;
