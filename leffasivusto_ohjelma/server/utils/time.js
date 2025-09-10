// server/utils/time.js
// "1m" / "7d" / "45s" / "2h" -> millisekunnit
export function msFrom(str, fallback = "7d") {
  const s = (str || fallback).trim().toLowerCase();
  const m = s.match(/^(\d+)\s*([smhd])$/);
  if (!m) return 7 * 24 * 60 * 60 * 1000; // oletus 7d

  const n = Number(m[1]);
  const unit = m[2];
  const mult =
    unit === "s" ? 1000 :
    unit === "m" ? 60 * 1000 :
    unit === "h" ? 60 * 60 * 1000 :
    /* d */        24 * 60 * 60 * 1000;

  return n * mult;
}
