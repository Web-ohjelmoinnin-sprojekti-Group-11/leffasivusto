import { signAccess, signRefresh } from "../utils/jwt.js";
import { msFrom } from "../utils/time.js";

const REFRESH_TTL = process.env.REFRESH_TTL || "7d";
const isProd = process.env.NODE_ENV === "production";

export function setRefreshCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,                    // Renderissä true (HTTPS)
    sameSite: isProd ? "none" : "lax", // cross-site cookie vaatii "none"
    path: "/",                         // voit halutessa rajata '/api/auth'
    maxAge: msFrom(REFRESH_TTL),
  });
}

export function issueSession(res, user, debugLabel = "SESSION") {
  const accessToken  = signAccess(user);
  const refreshToken = signRefresh(user);
  setRefreshCookie(res, refreshToken);

  // (debug) poista kun ei enää tarvita
  console.log(`${debugLabel}: accessToken =`, accessToken);
  console.log(`${debugLabel}: refreshToken =`, refreshToken);

  return { accessToken, user };
}
