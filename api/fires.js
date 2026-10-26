// Vercel serverless function: latest NASA FIRMS hotspots over Indonesia.
// Needs the environment variable FIRMS_MAP_KEY (free: https://firms.modaps.eosdis.nasa.gov/api/map_key/).
// Returns compact rows: [lat, lon, acq_date, acq_time, satellite, confidence, frp, daynight]

const SOURCES = ["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT"];
const AREA = "94,-12,142,7"; // west,south,east,north (Indonesia)
const DAYS = 2;              // fetch 2 days, then keep the last 24 hours

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
  const key = process.env.FIRMS_MAP_KEY;
  if (!key) {
    res.status(503).json({ error: "FIRMS_MAP_KEY belum diatur di Vercel." });
    return;
  }
  try {
    const results = await Promise.allSettled(SOURCES.map(async src => {
      const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(key)}/${src}/${AREA}/${DAYS}`;
      const r = await fetch(url, { headers: { "User-Agent": "pantau-karhutla" } });
      const text = await r.text();
      if (!r.ok) throw new Error(src + " HTTP " + r.status + ": " + text.slice(0, 120));
      return parseCsv(text);
    }));
    const rows = results.filter(x => x.status === "fulfilled").flatMap(x => x.value);
    const failed = results.filter(x => x.status === "rejected").map(x => String(x.reason && x.reason.message || x.reason));
    if (!rows.length && failed.length) throw new Error(failed.join(" | "));
    const latest = rows.reduce((m, r) => Math.max(m, toMs(r)), 0);
    const recent = rows.filter(r => toMs(r) > latest - 24 * 3600e3);
    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");
    res.status(200).json({
      generated: new Date().toISOString(),
      latest: latest ? new Date(latest).toISOString() : null,
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
