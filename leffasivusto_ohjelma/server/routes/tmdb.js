// server/routes/tmdb.js
import { Router } from "express";
import {
  trending, search, titleByType, person, personCredits, discover, titleAuto, picker,
} from "../controllers/tmdbController.js";
import { curated } from "../controllers/curatedController.js"; // <-- uusi

const router = Router();

router.get("/trending", trending);
router.get("/search", search);
router.get("/title/:type/:id", titleByType);
router.get("/person/:id", person);
router.get("/person/:id/credits", personCredits);
router.get("/discover", discover);
router.get("/title/:id", titleAuto);
router.get("/picker", picker);

// UUSI curated-lista
router.get("/curated", curated);

export default router;
