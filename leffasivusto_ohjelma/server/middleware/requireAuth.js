const jwt = require("jsonwebtoken");

/** Miksi: varmennetaan pyyntö ja kiinnitetään käyttäjän id jatkoa varten. */
module.exports = function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload?.id) return res.status(401).json({ error: "Invalid token" });
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};