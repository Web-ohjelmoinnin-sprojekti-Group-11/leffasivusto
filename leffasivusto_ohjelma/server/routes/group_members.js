//ryhmän jäsenien hallinta jne.

import express from "express";
import pool from "../db.js";
import { verifyJWT } from "../middleware/auth.js";

const router = express.Router();

/* Liittymispyyntö ryhmään */
router.post("/:groupId/join", verifyJWT, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.user_id;

  try {
    const { rowCount } = await pool.query(
      `SELECT 1 FROM group_members WHERE user_id=$1 AND group_id=$2`,
      [userId, groupId]
    );
    if (rowCount) return res.status(400).json({ error: "Olet jo ryhmän jäsen" });

    await pool.query(
      `INSERT INTO group_members (user_id, group_id, role) VALUES ($1, $2, 'pending')`,
      [userId, groupId]
    );

    res.json({ message: "Liittymispyyntö lähetetty" });
  } catch (err) {
    console.error("Join request error:", err);
    res.status(500).json({ error: "Liittymispyynnön lähetys epäonnistui" });
  }
});

/* Omistaja hyväksyy/hylkää jäsenpyynnön */
router.post("/:groupId/requests/:userId", verifyJWT, async (req, res) => {
  const { groupId, userId: memberId } = req.params;
  const ownerId = req.user.user_id;
  const { action } = req.body; // "accept" tai "reject"

  try {
    const { rows } = await pool.query(
      `SELECT owner_id FROM groups WHERE group_id=$1`,
      [groupId]
    );
    if (!rows.length) return res.status(404).json({ error: "Ryhmä ei löytynyt" });
    if (rows[0].owner_id !== ownerId) {
      return res.status(403).json({ error: "Vain omistaja voi hallita pyynnöt" });
    }

    if (action === "accept") {
      await pool.query(
        `UPDATE group_members SET role='member' WHERE user_id=$1 AND group_id=$2 AND role='pending'`,
        [memberId, groupId]
      );
      return res.json({ message: "Pyyntö hyväksytty" });
    } else if (action === "reject") {
      await pool.query(
        `DELETE FROM group_members WHERE user_id=$1 AND group_id=$2 AND role='pending'`,
        [memberId, groupId]
      );
      return res.json({ message: "Pyyntö hylätty" });
    } else {
      return res.status(400).json({ error: "Virheellinen toiminto" });
    }
  } catch (err) {
    console.error("Request handle error:", err);
    res.status(500).json({ error: "Pyynnön käsittely epäonnistui" });
  }
});

/* Jäsen poistuu ryhmästä */
router.delete("/:groupId/leave", verifyJWT, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.user_id;

  try {
    await pool.query(
      `DELETE FROM group_members WHERE user_id=$1 AND group_id=$2`,
      [userId, groupId]
    );
    res.json({ message: "Poistuit ryhmästä" });
  } catch (err) {
    console.error("Leave error:", err);
    res.status(500).json({ error: "Ryhmän jättäminen epäonnistui" });
  }
});

/* Omistaja poistaa jäsenen */
router.delete("/:groupId/members/:userId", verifyJWT, async (req, res) => {
  const { groupId, userId: memberId } = req.params;
  const ownerId = req.user.user_id;

  try {
    const { rows } = await pool.query(
      `SELECT owner_id FROM groups WHERE group_id=$1`,
      [groupId]
    );
    if (!rows.length) return res.status(404).json({ error: "Ryhmä ei löytynyt" });
    if (rows[0].owner_id !== ownerId) {
      return res.status(403).json({ error: "Vain omistaja voi poistaa jäseniä" });
    }

    await pool.query(
      `DELETE FROM group_members WHERE user_id=$1 AND group_id=$2`,
      [memberId, groupId]
    );
    res.json({ message: "Jäsen poistettu" });
  } catch (err) {
    console.error("Remove member error:", err);
    res.status(500).json({ error: "Jäsenen poisto epäonnistui" });
  }
});

export default router;
