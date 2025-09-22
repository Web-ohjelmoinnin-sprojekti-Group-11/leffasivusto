// FILE: server/routes/finnkino.js
import express from "express";
import { XMLParser } from "fast-xml-parser";

// WHY: vakaampi verkko + proxy-tuki (VPN exposed proxy -> FINNKINO_PROXY)
let fetchImpl = globalThis.fetch;
try {
  const u = await import("undici");
  const { setGlobalDispatcher, Agent } = u;
  if (process.env.FINNKINO_PROXY) {
    const { ProxyAgent } = await import("undici/proxy-agent");
    setGlobalDispatcher(new ProxyAgent(process.env.FINNKINO_PROXY));
  } else if (process.env.FINNKINO_FORCE_IPV4 === "1") {
    setGlobalDispatcher(new Agent({ connect: { family: 4 } }));
  }
  fetchImpl = u.fetch || fetchImpl;
} catch {
  /* Node 18+ global fetch ok, muuten asenna undici */
}
const safeFetch = async (url, opts) => {
  if (!fetchImpl) throw new Error("fetch not available. Install `undici`");
  return fetchImpl(url, opts);
};

const router = express.Router();
const BASE = (process.env.FINNKINO_BASE || "https://www.finnkino.fi/xml").replace(/\/$/, "");
const UA =
  process.env.FINNKINO_USER_AGENT ||
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const REFERER = process.env.FINNKINO_REFERER || "https://www.finnkino.fi/";
const SLOW_MS = Number(process.env.FINNKINO_SLOW_MS || 0); // WHY: tee vedosta “hidas” jos haluat
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

// Simple in-memory cache
const cache = new Map(); // key -> { v, t, ms }
const putCache = (k, v, ms = 90_000) => cache.set(k, { v, t: Date.now(), ms });
const getFresh = (k) => {
  const e = cache.get(k);
  return e && Date.now() - e.t < e.ms ? e.v : null;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchXml(pathAndQuery) {
  const url = `${BASE}${pathAndQuery}`;
  const cached = getFresh(url);
  if (cached) return cached;

  // optional global slow-down
  if (SLOW_MS > 0) await sleep(SLOW_MS);

  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await safeFetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "application/xml,text/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "fi-FI,fi;q=0.9,en;q=0.8",
          Referer: REFERER,
          Connection: "keep-alive",
        },
      });
      const ct = res.headers.get("content-type") || "";
      const text = await res.text();

      // Cloudflare block typically returns HTML
      if (!res.ok || ct.includes("text/html") || /Cloudflare|Attention Required|blocked/i.test(text)) {
        throw new Error(`Blocked or HTML (${res.status})`);
      }

      const json = parser.parse(text);
      putCache(url, json, 90_000);
      return json;
    } catch (e) {
      lastErr = e;
      await sleep(250 * (attempt + 1)); // backoff
    }
  }
  throw lastErr;
}

function toFinnkinoDate(isoYYYYMMDD) {
  if (!isoYYYYMMDD) return "";
  const d = new Date(isoYYYYMMDD);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}.${mm}.${yy}`;
}

// --- Endpoints ---

// GET /api/finnkino/cities
router.get("/cities", async (_req, res) => {
  try {
    const j = await fetchXml("/TheatreAreas/");
    const list = j?.TheatreAreas?.TheatreArea ?? [];
    const arr = Array.isArray(list) ? list : [list].filter(Boolean);
    return res.json(arr.map((a) => ({ id: Number(a.ID), name: a.Name })));
  } catch (e) {
    console.error("GET /api/finnkino/cities:", e?.message || e);
    return res.json([]); // WHY: UI pysyy hengissä
  }
});

// GET /api/finnkino/theaters?area=ID
router.get("/theaters", async (req, res) => {
  try {
    const area = Number(req.query.area || 0);
    const j = await fetchXml("/Theatres/");
    const list = j?.Theatres?.Theatre ?? [];
    const arr = Array.isArray(list) ? list : [list].filter(Boolean);
    const out = arr
      .filter((t) => !area || Number(t.TheatreArea || 0) === area)
      .map((t) => ({ id: Number(t.ID), name: t.Name, area: Number(t.TheatreArea || 0) }));
    return res.json(out);
  } catch (e) {
    console.error("GET /api/finnkino/theaters:", e?.message || e);
    return res.json([]);
  }
});

// GET /api/finnkino/showtimes?area=ID&theatreId=ID&date=YYYY-MM-DD
router.get("/showtimes", async (req, res) => {
  try {
    const areaOrTheatre = String(req.query.theatreId || req.query.area || "").trim();
    const dt = toFinnkinoDate(String(req.query.date || "").trim());

    const qs = new URLSearchParams();
    if (areaOrTheatre) qs.set("area", areaOrTheatre); // Finnkino: 'area' toimii myös teatteri-ID:lle
    if (dt) qs.set("dt", dt);

    const j = await fetchXml(`/Schedule/?${qs.toString()}`);
    const raw = j?.Schedule?.Shows?.Show || j?.Shows?.Show || [];
    const shows = Array.isArray(raw) ? raw : [raw].filter(Boolean);

    const out = shows
      .map((s) => ({
        id: Number(s.ID || s.ShowID),
        title: s.Title,
        start: s.dttmShowStart,
        theatre: s.Theatre,
        theatreId: Number(s.TheatreID || s.TheatreId || 0),
        auditorium: s.TheatreAndAuditorium,
        image: s.Images?.EventLargeImagePortrait || s.Images?.EventSmallImagePortrait || null,
        eventUrl: s.EventURL || s.EventUrl || null,
        ratingImageUrl: s.RatingImageUrl || null,
        lengthInMinutes: s.LengthInMinutes ? Number(s.LengthInMinutes) : null,
        presentationMethod: s.PresentationMethod || null,
        price: s.EventPrice || null,
      }))
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    return res.json(out);
  } catch (e) {
    console.error("GET /api/finnkino/showtimes:", e?.message || e);
    return res.json([]);
  }
});

export default router;
