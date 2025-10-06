import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import groupRoutes from "./routes/groups.js";
import groupMembersRouter from "./routes/groupMembers.js";
import authRoutes from "./routes/auth.js";
import tmdbRoutes from "./routes/tmdb.js";
import authExtraRoutes from "./routes/authExtra.js";
import userRoutes from "./routes/user.js";
import reviewsRouter from './routes/reviews.js';
import groupContentRouter from "./routes/groupContent.js";
import groupShowtimesRouter from "./routes/groupShowtimes.js";
import pickerRouter from "./routes/pickerRouter.js";
import shareRouter from "./routes/share.js";


import pool from "./db.js";

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

const origins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(cors({ origin: origins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Existing
app.use("/api/auth", authRoutes);
app.use("/api/tmdb", tmdbRoutes);
app.use('/api/reviews', reviewsRouter);
// New
app.use("/api/auth", authExtraRoutes);
app.use("/api/user", userRoutes);

//
app.use("/api/groups", groupRoutes);
app.use("/api/group_members", groupMembersRouter);
app.use("/api/group_content", groupContentRouter);
app.use("/api/showtimes", groupShowtimesRouter);

//extra
app.use("/api/picker", pickerRouter);
// Public share route
app.use('/api/share', shareRouter);

app.get("/api/test", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, dbTime: result.rows[0] });
  } catch (err) {
    console.error("Healthcheck error:", err);
    res.status(500).json({ ok: false, error: "Database error" });
  }
});

app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Server error" });
});

export default app;


/* // FILE: server/app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import tmdbRoutes from "./routes/tmdb.js";
import authExtraRoutes from "./routes/authExtra.js"; // /api/auth/update, /api/auth/change-password
import userRoutes from "./routes/user.js";  
import finnkinoRoutes from "./routes/finnkino.js";          // /api/user/*
import pool from "./db.js";

const app = express();

// Proxy-tieto (tarpeen esim. Heroku/Nginx)
app.set("trust proxy", 1);
// Piilota Express-versio
app.disable("x-powered-by");

// CORS – luetaan sallitut origin(t) .env:stä (pilkuilla eroteltu), sallitaan cookies/headerit
const origins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin: origins,
    credentials: true,
  })
);

// Parserit
app.use(express.json());
app.use(cookieParser());

// Olemassa olevat reitit
app.use("/api/auth", authRoutes);
app.use("/api/tmdb", tmdbRoutes);

// Uudet reitit
app.use("/api/auth", authExtraRoutes); // /api/auth/update, /api/auth/change-password
app.use("/api/user", userRoutes);      // /api/user/favorites, /api/user/reviews, /api/user/history

// Healthcheck (DB + palvelin)
app.get("/api/test", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, dbTime: result.rows[0] });
  } catch (err) {
    console.error("Healthcheck error:", err);
    res.status(500).json({ ok: false, error: "Database error" });
  }
});

// ryhmäreitit
app.use("/api/groups", groupRoutes);              // ryhmän hallinta
app.use("/api/groups/members", groupMembersRoutes);  // jäsenten hallinta, invit jne
app.use("/api/groups/content", groupContentRoutes);  // sisältö

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Virhekäsittelijä
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Server error" });
});

export default app;
 */