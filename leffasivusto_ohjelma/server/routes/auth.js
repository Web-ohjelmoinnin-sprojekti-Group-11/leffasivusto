// server/routes/auth.js
import express from "express";
import { verifyJWT } from "../middleware/auth.js";
import {
  register,
  login,
  refresh,
  logout,
  me,
  remove,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login",    login);
router.post("/refresh",  refresh);
router.post("/logout",   logout);

router.get("/me", verifyJWT, me);
router.delete("/delete", verifyJWT, remove);

export default router;
