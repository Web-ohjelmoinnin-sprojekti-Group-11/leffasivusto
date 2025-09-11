// server/index.js
// Importataan kaikki tarpeellinen
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";     
import authRoutes from "./routes/auth.js";
import pool from "./db.js";

dotenv.config();

const app = express();

// Jos ajat reverse proxyn takana (esim. render/vercel/nginx), tämä tarvitaan,
// jotta secure-cookie toimii tuotannossa:
app.set("trust proxy", 1);

// CORS frontille – credentials = true, jotta cookie kulkee.
// Salli yksi tai useampi origin .env:stä (pilkulla eroteltu).
const origins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin: origins,
    credentials: true,
  })
);

// Body-parser ja cookie-parser
app.use(express.json());
app.use(cookieParser());                         

// Auth-reitit (login/register/me/refresh/logout jne.)
app.use("/api/auth", authRoutes);

// Yksinkertainen health/test -reitti (auttaa devissä & monitoroinnissa)
app.get("/api/test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ time: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// 404-fallback (valinnainen)
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Yleinen virhekäsittelijä (valinnainen, mutta hyödyllinen)
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Server error" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS origins: ${origins.join(", ")}`);
});
