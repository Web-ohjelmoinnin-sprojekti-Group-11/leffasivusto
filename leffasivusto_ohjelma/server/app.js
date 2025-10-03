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

// Auth routes – erotettu testien kannalta selkeiksi
app.use("/api/auth", authRoutes);          // /register, /login, /logout, /delete
app.use("/api/auth/extra", authExtraRoutes); // /update, /change-password

// Muu API
app.use("/api/tmdb", tmdbRoutes);
app.use("/api/user", userRoutes);
app.use("/api/reviews", reviewsRouter);

app.use("/api/groups", groupRoutes);
app.use("/api/group_members", groupMembersRouter);
app.use("/api/group_content", groupContentRouter);
app.use("/api/showtimes", groupShowtimesRouter);
app.use("/api/picker", pickerRouter);

// Healthcheck
app.get("/api/test", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, dbTime: result.rows[0] });
  } catch (err) {
    console.error("Healthcheck error:", err);
    res.status(500).json({ ok: false, error: "Database error" });
  }
});

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Virhekäsittelijä
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Server error" });
});

export default app;

/* TEST
import request from "supertest";
import { expect } from "chai";

describe("Auth API", () => {
  it("Rekisteröityminen onnistuu validilla datalla (201)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@example.com", password: "Testi123" });
    expect(res.status).to.equal(201);
  });

  it("Kirjautuminen onnistuu (200)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "Testi123" });
    expect(res.status).to.equal(200);
  });

  it("Uloskirjautuminen onnistuu (200)", async () => {
    const res = await request(app)
      .post("/api/auth/logout");
    expect(res.status).to.equal(200);
  });

  it("Käyttäjän poistaminen onnistuu (200)", async () => {
    const res = await request(app)
      .delete("/api/auth/delete")
      .send({ email: "test@example.com" });
    expect(res.status).to.equal(200);
  });
});

describe("Reviews API", () => {
  it("Arvostelujen selaaminen onnistuu (200)", async () => {
    const res = await request(app).get("/api/reviews");
    expect(res.status).to.equal(200);
  });
});
*/
