// server/helpers/session.js
import { signAccess, signRefresh } from "../utils/jwt.js";
import { msFrom } from "../utils/time.js";

const REFRESH_TTL = process.env.REFRESH_TTL || "7d";
const isProd = process.env.NODE_ENV === "production";

export function setRefreshCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: msFrom(REFRESH_TTL),
  });
}

/**
 * Luo sessionin (access+refresh), asettaa refresh-cookien
 * ja palauttaa payloadin vastaukseen.
 */
export function issueSession(res, user, debugLabel = "SESSION") {
  const accessToken  = signAccess(user);
  const refreshToken = signRefresh(user);
  setRefreshCookie(res, refreshToken);

  // DEBUG (helppo poistaa myöhemmin)
  console.log(`${debugLabel}: accessToken =`, accessToken);
  console.log(`${debugLabel}: refreshToken =`, refreshToken);

  return { accessToken, user };
}
