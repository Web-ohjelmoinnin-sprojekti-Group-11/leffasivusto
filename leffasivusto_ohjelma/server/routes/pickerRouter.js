// server/routes/pickerRouter.js
import { Router } from "express";
import { randomPick } from "../controllers/pickerController.js";

const router = Router();


router.get("/", randomPick);

export default router;
