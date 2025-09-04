// importataan taas kaikki tarpeellinen muualta
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pool from "./db.js";

// tuodaan auth
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
app.use(cors());       // frontin APIt
app.use(express.json());

// liitetään auth-reitit
app.use("/api/auth", authRoutes);

// testiyhteys
app.get("/api/test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ time: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
