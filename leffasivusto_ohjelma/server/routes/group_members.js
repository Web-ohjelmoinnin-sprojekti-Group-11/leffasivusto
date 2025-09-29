// server/routes/group_members.js
import express from "express";
import pool from "../db.js";
import { verifyJWT } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/group_members/:groupId/join
 * Send join request for the current user → role='pending'
 */
router.post("/:groupId/join", verifyJWT, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.user_id;

  try {
    // Already a member or pending?
    const { rowCount } = await pool.query(
      `SELECT 1 FROM group_members WHERE user_id=$1 AND group_id=$2`,
      [userId, groupId]
    );
    if (rowCount) {
      return res.status(400).json({ error: "You are already a member of this group" });
    }

    await pool.query(
      `INSERT INTO group_members (user_id, group_id, role)
       VALUES ($1, $2, 'pending')`,
      [userId, groupId]
    );

    return res.json({ message: "Join request sent" });
  } catch (err) {
    console.error("Join request error:", err);
    return res.status(500).json({ error: "Failed to send join request" });
  }
});

/**
 * POST /api/group_members/:groupId/requests/:userId
 * Owner accepts or rejects a pending request
 * body: { action: "accept" | "reject" }
 */
router.post("/:groupId/requests/:userId", verifyJWT, async (req, res) => {
  const { groupId, userId: memberId } = req.params;
  const ownerId = req.user.user_id;
  const { action } = req.body;

  try {
    // Only owner can manage requests
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
    }

    if (action === "reject") {
      await pool.query(
        `DELETE FROM group_members
         WHERE user_id=$1 AND group_id=$2 AND role='pending'`,
        [memberId, groupId]
      );
      return res.json({ message: "Request rejected" });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    console.error("Request handle error:", err);
    return res.status(500).json({ error: "Failed to process join request" });
  }
});

/**
 * DELETE /api/group_members/:groupId/leave
 * Member leaves the group (owner is not allowed to leave)
 */
router.delete("/:groupId/leave", verifyJWT, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.user_id;

  try {
    // Owner cannot leave (must delete group or transfer ownership)
    const g = await pool.query(
      `SELECT owner_id FROM groups WHERE group_id=$1`,
      [groupId]
    );
    if (!g.rowCount) return res.status(404).json({ error: "Group not found" });
    if (g.rows[0].owner_id === userId) {
      return res.status(400).json({
        error:
          "The owner cannot leave their own group. Delete the group or transfer ownership."
      });
    }

    const result = await pool.query(
      `DELETE FROM group_members WHERE user_id=$1 AND group_id=$2`,
      [userId, groupId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "You are not a member of this group" });
    }

    return res.json({ message: "You have left the group" });
  } catch (err) {
    console.error("Leave error:", err);
    return res.status(500).json({ error: "Failed to leave group" });
  }
});

/**
 * DELETE /api/group_members/:groupId/members/:userId
 * Owner removes a member (cannot remove themselves via this route)
 */
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

    return res.json({ message: "Member removed" });
  } catch (err) {
    console.error("Remove member error:", err);
    return res.status(500).json({ error: "Failed to remove member" });
  }
});

/**
 * GET /api/group_members/:groupId
 * Returns members of the group (admin, member, pending) and the caller's role
 * Only visible to members of the group.
 */
router.get("/:groupId", verifyJWT, async (req, res) => {
  const { groupId } = req.params;
  const requesterId = req.user.user_id;

  try {
    // Ensure requester is a member
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

    return res.json({ members: rows, myRole: me.rows[0].role });
  } catch (err) {
    console.error("Members list error:", err);
    return res.status(500).json({ error: "Failed to fetch members" });
  }
});

export default router;
