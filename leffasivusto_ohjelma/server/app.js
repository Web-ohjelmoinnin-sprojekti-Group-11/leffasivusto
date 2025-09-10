// server/app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";

const app = express();

// Jos käytätte reverse proxyä (devissä ok)
app.set("trust proxy", 1);

// CORS – lue sallitut origin(t) .env:stä, pilkuilla erotettuna
const origins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(s => s.trim());

app.use(cors({ origin: origins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// API-reitit
app.use("/api/auth", authRoutes);

// Healthcheck
app.get("/api/test", (_req, res) => res.json({ ok: true }));

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Virhekäsittelijä
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Server error" });
});

export default app;
