// server/db.js
import pkg from "pg";        // tietokanta yhteys
import dotenv from "dotenv";  // muuttuja .env:stä
import path from "path";      // polun käsittelyä varten

// Hakee .env-tiedoston yhden tason ylempää server-kansiosta
dotenv.config({ path: path.resolve("../.env") });

const { Pool } = pkg;

// tietokannan yhteyspooli
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

export default pool;
