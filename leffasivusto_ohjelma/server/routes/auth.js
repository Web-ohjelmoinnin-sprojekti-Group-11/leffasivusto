//tänne kaikki käyttäjän hallintaan liittyvä. Huomattavasti mukavampaa kun jaoteltu jos tarvii debyug tms. Eikä kaikki index.js sisällä :)

import express from "express";
import bcrypt from "bcrypt";
import pool from "../db.js";

const router = express.Router();

// rekisteröinti
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Tarkistetaan onko sähköposti validi eikä käytössä
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "Sähköposti on jo käytössä" });
    }

    // Hashataan salasana
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Tallennetaan tietokantaan
    const result = await pool.query(
      `INSERT INTO users (email, password_hash) 
       VALUES ($1, $2) 
       RETURNING user_id, email, created_at`,
      [email, passwordHash]
    );

    res.status(201).json({
      message: "Käyttäjä luotu onnistuneesti",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Rekisteröintivirhe:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
