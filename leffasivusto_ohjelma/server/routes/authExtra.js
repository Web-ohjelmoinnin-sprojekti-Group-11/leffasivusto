// server/routes/authExtra.js
import express from "express";
import { verifyJWT } from "../middleware/auth.js";
import { updateProfile, changePassword } from "../controllers/authExtraController.js";

const router = express.Router();

router.put("/update", verifyJWT, updateProfile);
router.post("/change-password", verifyJWT, changePassword);

export default router;
