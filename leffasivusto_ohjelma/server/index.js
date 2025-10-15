// server/index.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load server/.env explicitly (preferred) so tokens kept in server/.env are available
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

import app from "./app.js";
import runMigrations from "./migrations/run.js";

const PORT = process.env.PORT || 3001;

// Run migrations first, but do not start the server here for testing purposes
runMigrations()
  .then(() => {
    console.log('Migrations applied');
  })
  .catch((err) => {
    console.error('Startup migration failed:', err);
    process.exit(1);
  });

export default app;  // Tämä pitää exportata sovellus
