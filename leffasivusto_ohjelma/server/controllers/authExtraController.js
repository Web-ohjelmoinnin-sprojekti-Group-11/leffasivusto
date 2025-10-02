// server/controllers/authExtraController.js
import bcrypt from "bcrypt";
import {
  isEmailTaken,
  updateProfileFields,
  getPasswordHash,
  setPasswordHash,
} from "../models/authModel.js";

/** PUT /api/auth/update  Body: { email }  */
export async function updateProfile(req, res) {
  const userId = req.user?.user_id;
  const { email } = req.body ?? {};

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (typeof email === "undefined") {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
  if (!okEmail) return res.status(400).json({ error: "Invalid email" });

  try {
    if (await isEmailTaken(email, userId)) {
      return res.status(409).json({ error: "Email already in use" });
    }
    const user = await updateProfileFields(userId, { email });
    if (!user) return res.status(400).json({ error: "Nothing to update" });
    return res.json({ user });
  } catch (e) {
    console.error("auth/update error:", e);
    return res.status(500).json({ error: "Failed to update profile" });
  }
}

/** POST /api/auth/change-password  Body: { currentPassword, newPassword } */
export async function changePassword(req, res) {
  const userId = req.user?.user_id;
  const { currentPassword, newPassword } = req.body ?? {};

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (String(newPassword).length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  try {
    const curHash = await getPasswordHash(userId);
    if (!curHash) return res.status(404).json({ error: "User not found" });

    const ok = await bcrypt.compare(String(currentPassword), curHash);
    if (!ok) return res.status(400).json({ error: "Current password incorrect" });

    const hash = await bcrypt.hash(String(newPassword), 10);
    await setPasswordHash(userId, hash);

    // (valinnainen, mutta suositeltava) Invalidoi vanhat istunnot:
    // poistetaan refreshToken-cookies, jolloin käyttäjän täytyy kirjautua uudelleen
    res.clearCookie("refreshToken", { path: "/" });

    return res.json({ success: true });
  } catch (e) {
    console.error("auth/change-password error:", e);
    return res.status(500).json({ error: "Failed to change password" });
  }
}
