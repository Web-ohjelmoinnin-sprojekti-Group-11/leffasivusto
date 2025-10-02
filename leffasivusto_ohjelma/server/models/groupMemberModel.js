// server/models/groupMemberModel.js
import pool from "../db.js";

/** Palauta ryhmän owner_id tai null jos ryhmää ei ole. */
export async function getOwnerId(groupId) {
  const { rows } = await pool.query(
    `SELECT owner_id FROM groups WHERE group_id=$1`,
    [groupId]
  );
  return rows.length ? rows[0].owner_id : null;
}

/** Onko käyttäjä ryhmän jäsen (mukaan lukien pending). */
export async function hasAnyMembership({ userId, groupId }) {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM group_members WHERE user_id=$1 AND group_id=$2`,
    [userId, groupId]
  );
  return rowCount > 0;
}

/** Onko käyttäjä ryhmän jäsen (admin/member), EI pending. */
export async function isMember({ userId, groupId }) {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM group_members 
      WHERE user_id=$1 AND group_id=$2 AND role IN ('admin','member')`,
    [userId, groupId]
  );
  return rowCount > 0;
}

/** Käyttäjän rooli ryhmässä (tai null). */
export async function getRole({ userId, groupId }) {
  const { rows } = await pool.query(
    `SELECT role FROM group_members WHERE user_id=$1 AND group_id=$2`,
    [userId, groupId]
  );
  return rows[0]?.role ?? null;
}

/** Luo join-pyyntö (role='pending'). */
export async function insertPending({ userId, groupId }) {
  await pool.query(
    `INSERT INTO group_members (user_id, group_id, role) VALUES ($1, $2, 'pending')`,
    [userId, groupId]
  );
}

/** Hyväksy pending → member. */
export async function acceptPending({ memberId, groupId }) {
  const { rowCount } = await pool.query(
    `UPDATE group_members SET role='member'
      WHERE user_id=$1 AND group_id=$2 AND role='pending'`,
    [memberId, groupId]
  );
  return rowCount;
}

/** Hylkää pending → delete. */
export async function rejectPending({ memberId, groupId }) {
  const { rowCount } = await pool.query(
    `DELETE FROM group_members
      WHERE user_id=$1 AND group_id=$2 AND role='pending'`,
    [memberId, groupId]
  );
  return rowCount;
}

/** Poistu ryhmästä (delete own membership). */
export async function leaveGroup({ userId, groupId }) {
  const { rowCount } = await pool.query(
    `DELETE FROM group_members WHERE user_id=$1 AND group_id=$2`,
    [userId, groupId]
  );
  return rowCount;
}

/** Owner poistaa jäsenen. */
export async function removeMemberByOwner({ memberId, groupId }) {
  const { rowCount } = await pool.query(
    `DELETE FROM group_members WHERE user_id=$1 AND group_id=$2`,
    [memberId, groupId]
  );
  return rowCount;
}

/** Listaa jäsenet + käyttäjänimi. */
export async function listMembers({ groupId }) {
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
  return rows;
}
