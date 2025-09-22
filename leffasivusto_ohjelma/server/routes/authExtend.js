const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const db = require("../db"); // pooled pg client: export module.exports = new Pool(...)

/** PUT /auth/update – päivitä nimi/sähköposti */
router.put("/update", requireAuth, async (req, res) => {
  const { name, email } = req.body ?? {};
  if (!name && !email) return res.status(400).json({ error: "Nothing to update" });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }
  try {
    // Emailin uniikkius vain jos muuttuu
    if (email) {
      const { rows: exists } = await db.query("SELECT 1 FROM users WHERE email = $1 AND id <> $2", [email, req.user.id]);
      if (exists.length) return res.status(409).json({ error: "Email already in use" });
    }

    const fields = [];
    const values = [];
    let idx = 1;
    if (name)  { fields.push(`name = $${idx++}`);  values.push(name); }
    if (email) { fields.push(`email = $${idx++}`); values.push(email); }
    values.push(req.user.id);

    const sql = `UPDATE users SET ${fields.join(", ")}, updated_at = NOW()
                 WHERE id = $${idx} RETURNING id, email, name, created_at, updated_at`;
    const { rows } = await db.query(sql, values);
    return res.json(rows[0]);
  } catch (e) {
    console.error("auth/update", e);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

/** POST /auth/change-password – vaihda salasana */
router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  try {
    const { rows: users } = await db.query("SELECT id, password_hash FROM users WHERE id = $1", [req.user.id]);
    const user = users[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) return res.status(400).json({ error: "Current password incorrect" });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [hash, req.user.id]);
    return res.json({ success: true });
  } catch (e) {
    console.error("auth/change-password", e);
    return res.status(500).json({ error: "Failed to change password" });
  }
});

module.exports = router;
