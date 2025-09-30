// server/routes/showtimes.js
import express from "express";
import pool from "../db.js";
import { verifyJWT } from "../middleware/auth.js";

const router = express.Router();

/* helper: parse dd.mm.yyyy + HH:MM -> numerot Postgresin make_timestamptz:lle */
function parseDateParts(dateStr = "", timeStr = "") {
  const [dd, mm, yyyy] = String(dateStr).split(".");
  const [HH = "0", MM = "0"] = String(timeStr).split(":");
  const y = Number(yyyy), mo = Number(mm), d = Number(dd), h = Number(HH), mi = Number(MM);
  if (![y, mo, d, h, mi].every((n) => Number.isFinite(n))) return null;
  return { y, mo, d, h, mi };
}

/**
 * GET /api/showtimes/mine
 * Kaikki näytösjaot niistä ryhmistä, joissa käyttäjä on jäsen.
 * Palauttaa: { showtimes: [...] }
 *
 * HUOM: tämä reitti täytyy määritellä ENNEN "/:groupId"
 */
router.get("/mine", verifyJWT, async (req, res) => {
  const userId = req.user?.user_id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Haetaan VAIN käyttäjän itse lisäämät näytökset (s.user_id = current user)
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
    res.json({ showtimes: rows });
  } catch (err) {
    console.error("List my showtimes error:", err);
    res.status(500).json({ error: "Failed to fetch showtimes" });
  }
});


/**
 * POST /api/showtimes/:groupId
 * Body: { title, theatre_name, date: "dd.mm.yyyy", showtime: "HH:MM", movie_id?: number|null }
 */
router.post("/:groupId", verifyJWT, async (req, res) => {
  const userId = req.user?.user_id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const groupId = Number(req.params.groupId);
  if (!Number.isFinite(groupId)) {
    return res.status(400).json({ error: "Invalid group id" });
  }

  let { title, theatre_name, date, showtime, movie_id } = req.body || {};
  if (!title || !theatre_name || !date || !showtime) {
    return res
      .status(400)
      .json({ error: "title, theatre_name, date and showtime are required" });
  }

  const parts = parseDateParts(date, showtime);
  if (!parts) return res.status(400).json({ error: "Invalid date/time format" });
  const { y, mo, d, h, mi } = parts;

  const movieIdOrNull = Number.isFinite(Number(movie_id)) ? Number(movie_id) : null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // varmistetaan ryhmäjäsenyys
    const me = await client.query(
      `SELECT 1
         FROM group_members
        WHERE user_id = $1 AND group_id = $2 AND role IN ('admin','member')`,
      [userId, groupId]
    );
    if (!me.rowCount) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // talletetaan timestamptz Europe/Helsinki -ajassa
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
      [movieIdOrNull, title, theatre_name, y, mo, d, h, mi, groupId, userId]
    );

    await client.query("COMMIT");
    res.status(201).json({ showtime: ins.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Add showtime error:", err);
    res.status(500).json({ error: "Failed to add showtime" });
  } finally {
    client.release();
  }
});

/**
 * GET /api/showtimes/:groupId
 * Ryhmän näytösjaot uusin ensin, mukana lisääjän email + pretty_time.
 * Palauttaa: { showtimes: [...] }
 */
router.get("/:groupId", verifyJWT, async (req, res) => {
  const userId = req.user?.user_id;
  const groupId = Number(req.params.groupId);
  if (!Number.isFinite(groupId)) {
    return res.status(400).json({ error: "Invalid group id" });
  }

  try {
    // onko käyttäjä ko. ryhmän jäsen?
    const me = await pool.query(
      `SELECT 1 FROM group_members WHERE user_id=$1 AND group_id=$2`,
      [userId, groupId]
    );
    if (!me.rowCount) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const rows = await pool.query(
      `
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
      `,
      [groupId]
    );

    res.json({ showtimes: rows.rows });
  } catch (err) {
    console.error("List showtimes error:", err);
    res.status(500).json({ error: "Failed to fetch showtimes" });
  }
});

export default router;
