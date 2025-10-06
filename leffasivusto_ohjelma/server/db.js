// server/db.js
import pkg from "pg";        // tietokanta yhteys
import dotenv from "dotenv";  // muuttuja .env:stä
import path from "path";      // polun käsittelyä varten
import fs from "fs";
import { fileURLToPath } from 'url'

// Resolve .env relative to this file (server/.env preferred)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serverEnv = path.resolve(__dirname, '.env')
const rootEnv = path.resolve(__dirname, '..', '.env')
let envPath = rootEnv
if (fs.existsSync(serverEnv)) {
  envPath = serverEnv
} else if (fs.existsSync(rootEnv)) {
  envPath = rootEnv
}
dotenv.config({ path: envPath })

// Sanitize common secrets that might be wrapped in quotes in .env (remove surrounding single/double quotes)
if (typeof process.env.DB_PASSWORD === 'string') {
  const m = process.env.DB_PASSWORD.match(/^(['"])(.*)\1$/);
  if (m) process.env.DB_PASSWORD = m[2];
}
if (typeof process.env.JWT_SECRET === 'string') {
  const m = process.env.JWT_SECRET.match(/^(['"])(.*)\1$/);
  if (m) process.env.JWT_SECRET = m[2];
}

const { Pool } = pkg;

// tietokannan yhteyspooli
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// Diagnostics suppressed in production to avoid leaking secrets.
// If you need to debug DB connection issues, temporarily enable detailed diagnostics here
// or set a dedicated debug flag (e.g. process.env.SHOW_DB_DIAGS).

export default pool;
