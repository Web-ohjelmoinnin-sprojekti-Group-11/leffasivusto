import jwt from "jsonwebtoken";

export default function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 🔧 Hyväksy sekä id että user_id
    const uid = payload?.id ?? payload?.user_id;
    if (!uid) return res.status(401).json({ error: "Invalid token" });

    // Tallenna molemmat nimillä joita muu koodi saattaa käyttää
    req.user = { id: uid, user_id: uid, email: payload?.email ?? null };
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
