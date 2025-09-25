// server/routes/groups.js
import express from "express";
import pool from "../db.js";
import { verifyJWT } from "../middleware/auth.js";

const router = express.Router();

/* Luo uusi ryhmä (transaktiona) */
router.post("/", verifyJWT, async (req, res) => {
  const rawName = req.body?.group_name ?? "";
  const groupName = String(rawName).trim();
  const ownerId = req.user?.user_id;

  if (!ownerId) return res.status(401).json({ error: "Unauthorized" });
  if (!groupName) return res.status(400).json({ error: "Group name is required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO groups (owner_id, group_name)
       VALUES ($1, $2)
       RETURNING group_id, owner_id, group_name, created_at`,
      [ownerId, groupName]
    );
    const group = rows[0];

    // HUOM: kannan CHECK sallii vain ('member','admin') → käytetään 'admin'
    await client.query(
      `INSERT INTO group_members (user_id, group_id, role)
       VALUES ($1, $2, 'admin')`,
      [ownerId, group.group_id]
    );

    await client.query("COMMIT");
    return res.status(201).json({ group });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Group create error:", err);
    return res.status(500).json({ error: "Ryhmän luonti epäonnistui" });
  } finally {
    client.release();
  }
});

/* Listaa kaikki ryhmät */
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT group_id, group_name, owner_id, created_at
       FROM groups
       ORDER BY created_at DESC`
    );
    res.json({ groups: rows });
  } catch (err) {
    console.error("Group list error:", err);
    res.status(500).json({ error: "Ryhmien haku epäonnistui" });
  }
});

/* Näytä yksittäinen ryhmä (vain jäsenille) */
router.get("/:id", verifyJWT, async (req, res) => {
  const groupId = req.params.id;
  const userId = req.user.user_id;

  try {
    const { rows: g } = await pool.query(
      `SELECT * FROM groups WHERE group_id = $1`,
      [groupId]
    );
    if (!g.length) return res.status(404).json({ error: "Ryhmä ei löytynyt" });

    const { rows: membership } = await pool.query(
      `SELECT role FROM group_members WHERE user_id=$1 AND group_id=$2`,
      [userId, groupId]
    );
    if (!membership.length) {
      return res.status(403).json({ error: "Et ole tämän ryhmän jäsen" });
    }

    res.json({ group: g[0], membership: membership[0] });
  } catch (err) {
    console.error("Group fetch error:", err);
    res.status(500).json({ error: "Ryhmän haku epäonnistui" });
  }
});

/* Poista ryhmä (vain omistaja) */
router.delete("/:id", verifyJWT, async (req, res) => {
  const groupId = req.params.id;
  const userId = req.user.user_id;

  try {
    const { rows } = await pool.query(
      `SELECT owner_id FROM groups WHERE group_id = $1`,
      [groupId]
    );
    if (!rows.length) return res.status(404).json({ error: "Ryhmä ei löytynyt" });
    if (rows[0].owner_id !== userId) {
      return res.status(403).json({ error: "Vain omistaja voi poistaa ryhmän" });
    }

    await pool.query(`DELETE FROM groups WHERE group_id = $1`, [groupId]);
    res.json({ message: "Ryhmä poistettu" });
  } catch (err) {
    console.error("Group delete error:", err);
    res.status(500).json({ error: "Ryhmän poisto epäonnistui" });
  }
});

export default router;
