// server/controllers/groupShowtimeController.js
import {
  isMember,
  listMyShowtimes,
  listGroupShowtimes,
  insertShowtime,
} from "../models/groupShowtimeModel.js";

/* helper: parse dd.mm.yyyy + HH:MM -> numerot Postgresin make_timestamptz:lle */
function parseDateParts(dateStr = "", timeStr = "") {
  const [dd, mm, yyyy] = String(dateStr).split(".");
  const [HH = "0", MM = "0"] = String(timeStr).split(":");
  const y = Number(yyyy), mo = Number(mm), d = Number(dd), h = Number(HH), mi = Number(MM);
  if (![y, mo, d, h, mi].every((n) => Number.isFinite(n))) return null;
  return { y, mo, d, h, mi };
}

/** GET /api/showtimes/mine */
export async function getMine(req, res) {
  const userId = req.user?.user_id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const rows = await listMyShowtimes({ userId });
    return res.json({ showtimes: rows });
  } catch (err) {
    console.error("List my showtimes error:", err);
    return res.status(500).json({ error: "Failed to fetch showtimes" });
  }
}

/** GET /api/showtimes/:groupId */
export async function getByGroup(req, res) {
  const userId = req.user?.user_id;
  const groupId = Number(req.params.groupId);
  if (!Number.isFinite(groupId)) {
    return res.status(400).json({ error: "Invalid group id" });
  }

  try {
    // ryhmäjäsenyys
    const member = await isMember({ userId, groupId });
    if (!member) return res.status(403).json({ error: "You are not a member of this group" });

    const rows = await listGroupShowtimes({ groupId });
    return res.json({ showtimes: rows });
  } catch (err) {
    console.error("List showtimes error:", err);
    return res.status(500).json({ error: "Failed to fetch showtimes" });
  }
}

/** POST /api/showtimes/:groupId */
export async function create(req, res) {
  const userId = req.user?.user_id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const groupId = Number(req.params.groupId);
  if (!Number.isFinite(groupId)) {
    return res.status(400).json({ error: "Invalid group id" });
  }

  let { title, theatre_name, date, showtime, movie_id } = req.body || {};
  if (!title || !theatre_name || !date || !showtime) {
    return res.status(400).json({ error: "title, theatre_name, date and showtime are required" });
  }

  const parts = parseDateParts(date, showtime);
  if (!parts) return res.status(400).json({ error: "Invalid date/time format" });
  const { y, mo, d, h, mi } = parts;

  const movieIdOrNull = Number.isFinite(Number(movie_id)) ? Number(movie_id) : null;

  try {
    const result = await insertShowtime({
      userId,
      groupId,
      title,
      theatre_name,
      movie_id: movieIdOrNull,
      y, mo, d, h, mi,
    });

    if (result?.error === "not_member") {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    return res.status(201).json({ showtime: result.row });
  } catch (err) {
    console.error("Add showtime error:", err);
    return res.status(500).json({ error: "Failed to add showtime" });
  }
}
