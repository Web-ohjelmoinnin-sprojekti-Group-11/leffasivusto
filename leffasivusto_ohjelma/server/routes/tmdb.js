// server/routes/tmdb.js
import { Router } from "express";
import {
  trending,
  search,
  titleByType,
  person,
  personCredits,
  discover,
  titleAuto,
  picker,
} from "../controllers/tmdbController.js";

const router = Router();

// Yleisreitit
router.get("/trending", trending);
router.get("/search", search);
router.get("/title/:type/:id", titleByType);
router.get("/person/:id", person);
router.get("/person/:id/credits", personCredits);
router.get("/discover", discover);
router.get("/title/:id", titleAuto);

// Random picker
router.get("/picker", picker);

export default router;
