// server/db.js
import pkg from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env lataus
const serverEnv = path.resolve(__dirname, ".env");
const rootEnv   = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: fs.existsSync(serverEnv) ? serverEnv : (fs.existsSync(rootEnv) ? rootEnv : undefined) });

// pientä siivousta
const stripQuotes = (v) => (typeof v === "string" && /^(['"]).*\1$/.test(v) ? v.slice(1, -1) : v);
["DB_PASSWORD","JWT_SECRET","REFRESH_SECRET"].forEach(k => { if (process.env[k]) process.env[k] = stripQuotes(process.env[k]); });

const { Pool } = pkg;
const isTest = process.env.NODE_ENV === "test";
const dbName = isTest ? (process.env.TEST_DB_NAME || process.env.DB_NAME) : process.env.DB_NAME;

// –– SSL-valinta: "true"/"1" => päällä, muuten pois
const wantSSL = String(process.env.DB_SSL || "").toLowerCase() === "true" || process.env.DB_SSL === "1";
const sslOption = wantSSL ? { rejectUnauthorized: false } : undefined;

// Jos haluat tukea myös valmista DATABASE_URL:ia (sis. sslmode=require tms.)
const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: wantSSL ? { rejectUnauthorized: false } : undefined,
    }
  : {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || undefined,
      database: dbName,
      ssl: sslOption,
    };

const pool = new Pool(connectionConfig);
export default pool;
