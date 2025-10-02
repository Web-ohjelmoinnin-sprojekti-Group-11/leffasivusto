// server/models/groupShowtimeModel.js
import pool from "../db.js";

/** Tarkistaa onko user ryhmän jäsen (admin/member). */
export async function isMember({ userId, groupId }) {
  const q = `
    SELECT 1
      FROM group_members
     WHERE user_id = $1
       AND group_id = $2
       AND role IN ('admin','member')
  `;
  const { rows } = await pool.query(q, [userId, groupId]);
  return rows.length > 0;
}

/** Palauttaa kirjautuneen käyttäjän itse lisäämät showtimet (uusin ensin). */
export async function listMyShowtimes({ userId }) {
  const q = `
    SELECT s.id,
           s.movie_id,
           s.title,
           s.theatre_name,
           s.showtime,
           s.group_id,
           g.group_name,
           u.email AS added_by,
           s.created_at,
           to_char(s.showtime AT TIME ZONE 'Europe/Helsinki', 'DD.MM.YYYY HH24:MI') AS pretty_time
      FROM showtimes s
      JOIN groups g     ON g.group_id  = s.group_id
      LEFT JOIN users u ON u.user_id   = s.user_id
     WHERE s.user_id = $1
     ORDER BY s.showtime DESC, s.id DESC
  `;
  const { rows } = await pool.query(q, [userId]);
  return rows;
}

/** Palauttaa ryhmän showtimet (uusin ensin). */
export async function listGroupShowtimes({ groupId }) {
  const q = `
    SELECT s.id,
           s.movie_id,
           s.title,
           s.theatre_name,
           s.showtime,
           s.group_id,
           u.email AS added_by,
           s.created_at,
           to_char(s.showtime AT TIME ZONE 'Europe/Helsinki', 'DD.MM.YYYY HH24:MI') AS pretty_time
      FROM showtimes s
      JOIN users u ON u.user_id = s.user_id
     WHERE s.group_id = $1
     ORDER BY s.showtime DESC, s.id DESC
  `;
  const { rows } = await pool.query(q, [Number(groupId)]);
  return rows;
}

/** Lisää showtimen (talletus Europe/Helsinki -ajassa). */
export async function insertShowtime({
  userId, groupId, title, theatre_name, movie_id,
  y, mo, d, h, mi,
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ryhmäjäsenyyden tarkistus
    const chk = await client.query(
      `SELECT 1
         FROM group_members
        WHERE user_id=$1 AND group_id=$2 AND role IN ('admin','member')`,
      [userId, groupId]
    );
    if (!chk.rowCount) {
      await client.query("ROLLBACK");
      return { error: "not_member" };
    }

    const ins = await client.query(
      `
      INSERT INTO showtimes (movie_id, title, theatre_name, showtime, group_id, user_id)
      VALUES (
        $1,
        $2,
        $3,
        make_timestamptz($4, $5, $6, $7, $8, 0, 'Europe/Helsinki'),
        $9,
        $10
      )
      RETURNING id, movie_id, title, theatre_name, showtime, group_id, user_id, created_at
      `,
      [movie_id, title, theatre_name, y, mo, d, h, mi, groupId, userId]
    );

    await client.query("COMMIT");
    return { row: ins.rows[0] };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
