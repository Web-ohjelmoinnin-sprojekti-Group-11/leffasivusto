import axios from "axios";
import dotenv from "dotenv";
import path from "path";

// Lataa .env projektin juuresta
dotenv.config({ path: path.resolve("../.env") });
const tmdb = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  timeout: 15000,
  headers: {
    Authorization: `Bearer ${process.env.TMDB_V4_TOKEN}`, // V4 Read Access Token
    "Content-Type": "application/json;charset=utf-8",
  },
});

export default tmdb;
