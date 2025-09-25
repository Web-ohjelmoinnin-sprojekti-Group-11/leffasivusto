import express from "express";
import pool from "../db.js";
import { verifyJWT } from "../middleware/auth.js";

const router = express.Router();

/* Join request */
router.post("/:groupId/join", verifyJWT, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.user_id;

  try {
    const { rowCount } = await pool.query(
      `SELECT 1 FROM group_members WHERE user_id=$1 AND group_id=$2`,
      [userId, groupId]
    );
    if (rowCount) return res.status(400).json({ error: "You are already a member of this group" });

    await pool.query(
      `INSERT INTO group_members (user_id, group_id, role)
       VALUES ($1, $2, 'pending')`,
      [userId, groupId]
    );

    res.json({ message: "Join request sent" });
  } catch (err) {
    console.error("Join request error:", err);
    res.status(500).json({ error: "Failed to send join request" });
  }
});

/* Owner accepts/rejects join requests */
router.post("/:groupId/requests/:userId", verifyJWT, async (req, res) => {
  const { groupId, userId: memberId } = req.params;
  const ownerId = req.user.user_id;
  const { action } = req.body; // "accept" | "reject"

  try {
    const { rows } = await pool.query(
      `SELECT owner_id FROM groups WHERE group_id=$1`,
      [groupId]
    );
    if (!rows.length) return res.status(404).json({ error: "Group not found" });
    if (rows[0].owner_id !== ownerId) {
      return res.status(403).json({ error: "Only the owner can manage join requests" });
    }

    if (action === "accept") {
      await pool.query(
        `UPDATE group_members
         SET role='member'
         WHERE user_id=$1 AND group_id=$2 AND role='pending'`,
        [memberId, groupId]
      );
      return res.json({ message: "Request accepted" });
    } else if (action === "reject") {
      await pool.query(
        `DELETE FROM group_members WHERE user_id=$1 AND group_id=$2 AND role='pending'`,
        [memberId, groupId]
      );
      return res.json({ message: "Request rejected" });
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }
  } catch (err) {
    console.error("Request handle error:", err);
    res.status(500).json({ error: "Failed to process join request" });
  }
});

/* Member leaves a group */
router.delete("/:groupId/leave", verifyJWT, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.user_id;

  try {
    await pool.query(
      `DELETE FROM group_members WHERE user_id=$1 AND group_id=$2`,
      [userId, groupId]
    );
    res.json({ message: "You have left the group" });
  } catch (err) {
    console.error("Leave error:", err);
    res.status(500).json({ error: "Failed to leave group" });
  }
});

/* Owner removes a member */
router.delete("/:groupId/members/:userId", verifyJWT, async (req, res) => {
  const { groupId, userId: memberId } = req.params;
  const ownerId = req.user.user_id;

  try {
    const { rows } = await pool.query(
      `SELECT owner_id FROM groups WHERE group_id=$1`,
      [groupId]
    );
    if (!rows.length) return res.status(404).json({ error: "Group not found" });
    if (rows[0].owner_id !== ownerId) {
      return res.status(403).json({ error: "Only the owner can remove members" });
    }

    await pool.query(
      `DELETE FROM group_members WHERE user_id=$1 AND group_id=$2`,
      [memberId, groupId]
    );
    res.json({ message: "Member removed" });
  } catch (err) {
    console.error("Remove member error:", err);
    res.status(500).json({ error: "Failed to remove member" });
  }
});

/* Get group members (admin, member, pending) */
router.get("/:groupId", verifyJWT, async (req, res) => {
  const { groupId } = req.params;
  const requesterId = req.user.user_id;

  try {
    // allow only members to see the list
    const me = await pool.query(
      `SELECT role FROM group_members WHERE user_id=$1 AND group_id=$2`,
      [requesterId, groupId]
    );
    if (!me.rowCount) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const { rows } = await pool.query(
      `SELECT gm.user_id,
              gm.role,
              u.email AS username
       FROM group_members gm
       JOIN users u ON u.user_id = gm.user_id
       WHERE gm.group_id=$1
       ORDER BY (gm.role='admin') DESC,
                (gm.role='member') DESC,
                username ASC`,
      [groupId]
    );

    res.json({ members: rows, myRole: me.rows[0].role });
  } catch (err) {
    console.error("Members list error:", err);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

export default router;
