// Vercel serverless function: satellite photo (true colour + fire overlay) around a hotspot.
// Proxies NASA GIBS WMS so viewers' browsers don't hit GIBS directly.
// GET /api/citra?lat=-2.6&lon=113.9&date=2026-10-25&size=320[&fire=1]

const GIBS = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi";
const TRUE_COLOR = "VIIRS_NOAA20_CorrectedReflectance_TrueColor";
const FIRE = "VIIRS_NOAA20_Thermal_Anomalies_375m_All";
const SIZES = new Set([160, 320, 640]);
const HALF = 0.3; // degrees around the point (~65 km box)

async function handler(req, res) {
  const q = req.query || {};
  const lat = parseFloat(q.lat), lon = parseFloat(q.lon);
  const size = parseInt(q.size || "320", 10);
  const date = String(q.date || "");
  if (!isFinite(lat) || !isFinite(lon) || lat < -12 || lat > 7 || lon < 94 || lon > 142 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) || !SIZES.has(size)) {
    res.status(400).json({ error: "Parameter tidak valid." });
    return;
  }
  const layers = q.fire === "0" ? TRUE_COLOR : TRUE_COLOR + "," + FIRE;
  const bbox = [lat - HALF, lon - HALF, lat + HALF, lon + HALF].map(v => v.toFixed(3)).join(",");
  const url = `${GIBS}?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=${layers}&STYLES=&CRS=EPSG:4326` +
              `&BBOX=${bbox}&WIDTH=${size}&HEIGHT=${size}&FORMAT=image/jpeg&TIME=${date}`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "pantau-karhutla (vercel)" } });
    const type = r.headers.get("content-type") || "";
    if (!r.ok || !type.startsWith("image/")) {
      const text = await r.text();
      res.status(502).json({ error: "NASA GIBS: HTTP " + r.status, detail: text.slice(0, 200) });
      return;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    const today = new Date().toISOString().slice(0, 10);
    // Past days never change; today's mosaic fills in during the day.
    res.setHeader("Cache-Control", date < today ? "public, s-maxage=604800, max-age=86400" : "public, s-maxage=1800, max-age=600");
    res.setHeader("Content-Type", type);
    res.status(200).send(buf);
  } catch (e) {
    res.status(502).json({ error: "Gagal mengambil citra: " + e.message });
  }
}

module.exports = handler;
