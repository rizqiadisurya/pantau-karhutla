// Vercel serverless function: NASA GIBS daily true-colour tiles (smoke & clouds) as a map layer.
// GET /api/tile?z=5&x=26&y=16&date=2026-10-26
// Proxied because GIBS blocks some viewers' browsers directly.

const LAYER = "VIIRS_NOAA20_CorrectedReflectance_TrueColor";

async function handler(req, res) {
  const q = req.query || {};
  const z = parseInt(q.z, 10), x = parseInt(q.x, 10), y = parseInt(q.y, 10);
  const date = String(q.date || "");
  const max = 2 ** z;
  if (!(z >= 0 && z <= 9) || !(x >= 0 && x < max) || !(y >= 0 && y < max) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: "Parameter tidak valid." });
    return;
  }
  const url = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${LAYER}/default/${date}/GoogleMapsCompatible_Level9/${z}/${y}/${x}.jpg`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "pantau-karhutla (vercel)" } });
    const type = r.headers.get("content-type") || "";
    if (!r.ok || !type.startsWith("image/")) {
      res.status(r.status === 404 ? 404 : 502).json({ error: "NASA GIBS: HTTP " + r.status });
      return;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    const today = new Date().toISOString().slice(0, 10);
    res.setHeader("Cache-Control", date < today ? "public, s-maxage=604800, max-age=86400" : "public, s-maxage=1800, max-age=600");
    res.setHeader("Content-Type", type);
    res.status(200).send(buf);
  } catch (e) {
    res.status(502).json({ error: "Gagal mengambil tile: " + e.message });
  }
}

module.exports = handler;
