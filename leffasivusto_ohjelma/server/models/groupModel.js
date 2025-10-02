// server/models/groupModel.js
import pool from "../db.js";

/** Luo ryhmä + liitä omistaja adminiksi (transaktio). Palauttaa group-rivin. */
export async function createGroup({ ownerId, groupName }) {
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

    await client.query(
      `INSERT INTO group_members (user_id, group_id, role)
       VALUES ($1, $2, 'admin')`,
      [ownerId, group.group_id]
    );

    await client.query("COMMIT");
    return group;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Listaa kaikki ryhmät (public). */
export async function listAllGroups() {
  const { rows } = await pool.query(
    `SELECT group_id, group_name, owner_id, created_at
     FROM groups
     ORDER BY created_at DESC`
  );
  return rows;
}

/** Listaa kirjautuneen käyttäjän ryhmät (admin/member). */
export async function listMyGroups({ userId }) {
  const { rows } = await pool.query(
    `SELECT g.group_id, g.group_name, g.owner_id, gm.role, g.created_at
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.group_id
      WHERE gm.user_id = $1 AND gm.role IN ('admin','member')
      ORDER BY g.created_at DESC`,
    [userId]
  );
  return rows;
}

/** Hae yksittäinen ryhmä. */
export async function getGroupById({ groupId }) {
  const { rows } = await pool.query(
    `SELECT * FROM groups WHERE group_id = $1`,
    [groupId]
  );
  return rows[0] || null;
}

/** Palauta käyttäjän rooli ryhmässä (tai null). */
export async function getMembership({ userId, groupId }) {
  const { rows } = await pool.query(
    `SELECT role FROM group_members WHERE user_id=$1 AND group_id=$2`,
    [userId, groupId]
  );
  return rows[0] || null;
}

/** Palauta ryhmän owner_id tai null jos ei löydy. */
export async function getOwnerId({ groupId }) {
  const { rows } = await pool.query(
    `SELECT owner_id FROM groups WHERE group_id = $1`,
    [groupId]
  );
  return rows[0]?.owner_id ?? null;
}

/** Poista ryhmä. */
export async function deleteGroup({ groupId }) {
  await pool.query(`DELETE FROM groups WHERE group_id = $1`, [groupId]);
}
