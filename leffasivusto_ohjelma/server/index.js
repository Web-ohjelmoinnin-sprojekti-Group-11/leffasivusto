// server/index.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Lataa nimenomaan server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

import app from "./app.js";
import runMigrations from "./migrations/run.js";

const PORT = process.env.PORT || 3001;

runMigrations()
  .then(() => {
    console.log("Migrations applied");

    // Älä kuuntele porteissa testimoodissa (Supertest ym.)
    if (process.env.NODE_ENV !== "test") {
      app.listen(PORT, () => {
        console.log(`API listening on http://localhost:${PORT}`);
      });
    }
  })
  .catch((err) => {
    console.error("Startup migration failed:", err);
    process.exit(1);
  });

export default app; // jätetään tämä, jotta testit voivat importata appin
