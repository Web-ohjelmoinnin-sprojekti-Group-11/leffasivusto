// server/utils/tmdb.js
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Lataa .env projektin juuresta: <repo>/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Jos .env on server-kansion sisällä, vaihda polku -> path.resolve(__dirname, "../.env")
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const token = process.env.TMDB_V4_TOKEN;
if (!token) {
  console.warn("[TMDB] Missing TMDB_V4_TOKEN in .env");
}

const tmdb = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  timeout: 15000,
  headers: {
    Authorization: `Bearer ${token}`,           // TMDB v4 Read Access Token
    "Content-Type": "application/json;charset=utf-8",
  },
  params: {
    language: "en-US",
  },
});

export default tmdb;
