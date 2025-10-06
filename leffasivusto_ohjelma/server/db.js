// server/db.js
import pkg from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1) Lataa .env: ensisijaisesti server/.env, muuten projektin juuren .env
const serverEnv = path.resolve(__dirname, ".env");
const rootEnv = path.resolve(__dirname, "..", ".env");

let envPath = null;
if (fs.existsSync(serverEnv)) envPath = serverEnv;
else if (fs.existsSync(rootEnv)) envPath = rootEnv;

if (envPath) dotenv.config({ path: envPath });
else dotenv.config(); // fallback: etsi oletuspoluista

// 2) Siivoa yleiset "lainausmerkeillä ympäröidyt" salaisuudet
const stripQuotes = (v) => {
  if (typeof v !== "string") return v;
  const m = v.match(/^(['"])(.*)\1$/);
  return m ? m[2] : v;
};
if (process.env.DB_PASSWORD) process.env.DB_PASSWORD = stripQuotes(process.env.DB_PASSWORD);
if (process.env.JWT_SECRET) process.env.JWT_SECRET = stripQuotes(process.env.JWT_SECRET);
if (process.env.REFRESH_SECRET) process.env.REFRESH_SECRET = stripQuotes(process.env.REFRESH_SECRET);

// 3) Valitse oikea tietokannan nimi ympäristön mukaan
const isTest = process.env.NODE_ENV === "test";
const dbName = isTest ? (process.env.TEST_DB_NAME || process.env.DB_NAME) : process.env.DB_NAME;

const { Pool } = pkg;

// 4) Valinnainen diagnostiikka (ei tulosta salaisuuksia)
if (process.env.SHOW_DB_DIAGS === "1") {
  console.log("✅ .env ladattu:", envPath || "(dotenv default)");
  console.log("NODE_ENV:", process.env.NODE_ENV || "undefined");
  console.log("DB_USER:", process.env.DB_USER || "puuttuu");
  console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "********" : "puuttuu");
  console.log("DB_HOST:", process.env.DB_HOST || "puuttuu");
  console.log("DB_PORT:", process.env.DB_PORT || "puuttuu");
  console.log("DB_NAME:", dbName || "puuttuu");
}

// 5) Luo tietokantapooli
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || undefined,
  database: dbName,
  // Jos tarvitsette SSL:n tuotantoon:
  // ssl: process.env.DB_SSL === "1" ? { rejectUnauthorized: false } : undefined,
});

// Diagnostics suppressed in production to avoid leaking secrets.

export default pool;
