// server/middleware/auth.js
import jwt from "jsonwebtoken";

export function verifyJWT(req, res, next) {
  // Allow CORS preflight requests through without Authorization
  // Browsers send an OPTIONS preflight for cross-origin POST/PUT/DELETE with JSON
  // and that request won't include Authorization header. Skip auth for OPTIONS.
  if (req.method === 'OPTIONS') return next();
  const auth = req.headers.authorization || "";
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: "Invalid or expired token" });
    req.user = payload; // { user_id, email, iat, exp }
    next();
  });
}
