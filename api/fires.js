// Vercel serverless function: latest NASA FIRMS hotspots over Indonesia.
// Needs the environment variable FIRMS_MAP_KEY (free: https://firms.modaps.eosdis.nasa.gov/api/map_key/).
// Returns compact rows: [lat, lon, acq_date, acq_time, satellite, confidence, frp, daynight]

const SOURCES = ["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT"];
const AREA = "94,-12,142,7"; // west,south,east,north (Indonesia)

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const head = lines[0].split(",").map(h => h.trim().toLowerCase());
  const ix = n => head.indexOf(n);
  const need = ["latitude", "longitude", "acq_date", "acq_time"];
  if (need.some(n => ix(n) < 0)) throw new Error("Unexpected FIRMS response: " + lines[0].slice(0, 120));
  const iLat = ix("latitude"), iLon = ix("longitude"), iDate = ix("acq_date"), iTime = ix("acq_time"),
        iSat = ix("satellite"), iConf = ix("confidence"), iFrp = ix("frp"), iDn = ix("daynight");
  return lines.slice(1).map(l => {
    const v = l.split(",");
    return [
      Math.round(parseFloat(v[iLat]) * 1e4) / 1e4,
      Math.round(parseFloat(v[iLon]) * 1e4) / 1e4,
      v[iDate],
      String(v[iTime] || "0").padStart(4, "0"),
      iSat >= 0 ? v[iSat] : "",
      iConf >= 0 ? v[iConf] : "n",
      iFrp >= 0 ? parseFloat(v[iFrp]) || 0 : 0,
      iDn >= 0 ? v[iDn] : ""
    ];
  }).filter(r => isFinite(r[0]) && isFinite(r[1]));
}

const toMs = r => Date.parse(r[2] + "T" + r[3].slice(0, 2) + ":" + r[3].slice(2, 4) + ":00Z");

async function handler(req, res) {
  // ?days=1..7 → keep the last N×24 hours (fetch one extra day so the window is always full)
  const days = Math.min(7, Math.max(1, parseInt((req.query && req.query.days) || "1", 10) || 1));
  const DAYS = days + 1;
  const key = process.env.FIRMS_MAP_KEY;
  if (!key) {
    res.status(503).json({ error: "FIRMS_MAP_KEY belum diatur di Vercel." });
    return;
  }
  try {
    // FIRMS NRT accepts at most 5 days per request: split longer ranges into chunks.
    const chunks = [];
    if (DAYS <= 5) chunks.push({ range: DAYS, date: null });
    else {
      chunks.push({ range: 5, date: null }); // most recent 5 days (today-4 .. today)
      const older = DAYS - 5;
      const start = new Date(Date.now() - (DAYS - 1) * 864e5).toISOString().slice(0, 10);
      chunks.push({ range: older, date: start });
    }
    const jobs = [];
    for (const src of SOURCES) for (const c of chunks) jobs.push({ src, c });
    const results = await Promise.allSettled(jobs.map(async ({ src, c }) => {
      const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(key)}/${src}/${AREA}/${c.range}` + (c.date ? `/${c.date}` : "");
      const r = await fetch(url, { headers: { "User-Agent": "pantau-karhutla" } });
      const text = await r.text();
      if (!r.ok) throw new Error(src + " HTTP " + r.status + ": " + text.slice(0, 120));
      return parseCsv(text);
    }));
    const rows = results.filter(x => x.status === "fulfilled").flatMap(x => x.value);
    const failed = results.filter(x => x.status === "rejected").map(x => String(x.reason && x.reason.message || x.reason));
    if (!rows.length && failed.length) throw new Error(failed.join(" | "));
    const latest = rows.reduce((m, r) => Math.max(m, toMs(r)), 0);
    const recent = rows.filter(r => toMs(r) > latest - days * 24 * 3600e3);
    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");
    res.status(200).json({
      generated: new Date().toISOString(),
      latest: latest ? new Date(latest).toISOString() : null,
      days,
      sources: SOURCES,
      warnings: failed,
      rows: recent
    });
  } catch (e) {
    res.status(502).json({ error: "Gagal mengambil data FIRMS: " + e.message });
  }
}

module.exports = handler;
module.exports.parseCsv = parseCsv;
