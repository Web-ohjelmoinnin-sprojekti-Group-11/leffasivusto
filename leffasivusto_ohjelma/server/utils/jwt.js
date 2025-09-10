// server/utils/jwt.js
import jwt from "jsonwebtoken";

const ACCESS_TTL  = process.env.ACCESS_TTL  || "15m";
const REFRESH_TTL = process.env.REFRESH_TTL || "7d";

export function signAccess(user) {
  return jwt.sign(
    { user_id: user.user_id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

export function signRefresh(user) {
  return jwt.sign(
    { user_id: user.user_id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: REFRESH_TTL }
  );
}

// pikalukija (esim. refresh-reitillä jo valmiiksi käytitte jwt.verify)
export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
