import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import groupRoutes from "./routes/groups.js";
import groupMembersRouter from "./routes/groupMembers.js";
import authRoutes from "./routes/auth.js";
import tmdbRoutes from "./routes/tmdb.js";
import authExtraRouter from "./routes/authExtra.js";
import userRoutes from "./routes/user.js";
import reviewsRouter from "./routes/reviews.js";
import groupContentRouter from "./routes/groupContent.js";
import groupShowtimesRouter from "./routes/groupShowtimes.js";
import pickerRouter from "./routes/pickerRouter.js";
import shareRouter from "./routes/share.js";              // ✅ julkinen share-reitti

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

// Auth
app.use("/api/auth", authRoutes);        // /register, /login, /logout, /delete
app.use("/api/auth", authExtraRouter);   // /update, /change-password

// Muu API (vaatii authia reittien sisällä tarpeen mukaan)
app.use("/api/tmdb", tmdbRoutes);
app.use("/api/user", userRoutes);
app.use("/api/reviews", reviewsRouter);
app.use("/api/groups", groupRoutes);
app.use("/api/group_members", groupMembersRouter);
app.use("/api/group_content", groupContentRouter);
app.use("/api/showtimes", groupShowtimesRouter);
app.use("/api/picker", pickerRouter);

// Julkinen suosikkilistan jako: /api/share/:token (ei authia)
app.use("/api/share", shareRouter);      // ✅

/* Healthcheck */
app.get("/api/test", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, dbTime: result.rows[0] });
  } catch (err) {
    console.error("Healthcheck error:", err);
    res.status(500).json({ ok: false, error: "Database error" });
  }
});

/* 404 */
app.use((req, res) => res.status(404).json({ error: "Not found" }));

/* Virhekäsittelijä */
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Server error" });
});

export default app;
