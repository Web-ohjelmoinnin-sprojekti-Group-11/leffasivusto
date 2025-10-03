// server/db.js
import pkg from "pg";
import dotenv from "dotenv";
import path from "path";

// Lataa .env-tiedoston projektin juuresta (leffasivusto_ohjelma/.env)
const envPath = path.resolve("./.env"); // juurihakemisto, missä package.json
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("⚠️ .env-tiedoston lataus epäonnistui:", result.error);
} else {
  console.log("✅ .env ladattu:", envPath);
}

const { Pool } = pkg;

// Debug-tulostus varmistaaksesi, että muuttujat ovat oikein
console.log("DB_USER:", process.env.DB_USER || "puuttuu");
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "********" : "puuttuu");
console.log(
  "DB_NAME:",
  process.env.NODE_ENV === "test" ? process.env.TEST_DB_NAME : process.env.DB_NAME
);
console.log("NODE_ENV:", process.env.NODE_ENV || "undefined");

// Luo tietokantapooli
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database:
    process.env.NODE_ENV === "test" ? process.env.TEST_DB_NAME : process.env.DB_NAME,
});

export default pool;
