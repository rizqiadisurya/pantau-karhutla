// Vercel serverless function: archived NASA FIRMS VIIRS S-NPP hotspots over Indonesia, for trend statistics.
// GET /api/hist?date=2019-09-01&range=5[&src=SP|NRT]  → compact text, one detection per line: "lat,lon,yyyy-mm-dd,conf"
// GET /api/hist?avail=1                                → FIRMS data availability (which dates each source covers)
// Historical data never changes, so responses are cached for a long time at the edge.

const AREA = "94,-12,142,7";

async function handler(req, res) {
  const q = req.query || {};
  const key = process.env.FIRMS_MAP_KEY;
  if (!key) { res.status(503).json({ error: "FIRMS_MAP_KEY belum diatur di Vercel." }); return; }
  try {
    if (q.avail) {
      const r = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/${encodeURIComponent(key)}/all`);
      const t = await r.text();
      res.setHeader("Cache-Control", "s-maxage=3600");
      res.status(r.ok ? 200 : 502).setHeader("Content-Type", "text/plain; charset=utf-8").send(t);
      return;
    }
    const date = String(q.date || "");
    const range = Math.min(5, Math.max(1, parseInt(q.range || "5", 10) || 5));
    const src = q.src === "NRT" ? "VIIRS_SNPP_NRT" : "VIIRS_SNPP_SP";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { res.status(400).json({ error: "Parameter date tidak valid." }); return; }
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(key)}/${src}/${AREA}/${range}/${date}`;
    const r = await fetch(url, { headers: { "User-Agent": "pantau-karhutla" } });
    const text = await r.text();
    if (!r.ok || /invalid|error/i.test(text.slice(0, 80))) { res.status(502).json({ error: src + " HTTP " + r.status + ": " + text.slice(0, 160) }); return; }
    const lines = text.trim().split(/\r?\n/);
    const head = (lines[0] || "").split(",").map(h => h.trim().toLowerCase());
    const iLat = head.indexOf("latitude"), iLon = head.indexOf("longitude"), iDate = head.indexOf("acq_date"), iConf = head.indexOf("confidence");
    if (iLat < 0 && lines.length > 1) { res.status(502).json({ error: "Respons FIRMS tidak dikenal: " + lines[0].slice(0, 120) }); return; }
    const out = [];
    for (let k = 1; k < lines.length; k++) {
      const v = lines[k].split(",");
      const la = parseFloat(v[iLat]), lo = parseFloat(v[iLon]);
      if (!isFinite(la) || !isFinite(lo)) continue;
      out.push(la.toFixed(3) + "," + lo.toFixed(3) + "," + v[iDate] + "," + (iConf >= 0 ? String(v[iConf]).charAt(0) : "n"));
    }
    const old = Date.parse(date) < Date.now() - 120 * 864e5;
    res.setHeader("Cache-Control", old ? "public, s-maxage=31536000, max-age=86400" : "public, s-maxage=21600");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("X-Source", src);
    res.status(200).send(out.join("\n"));
  } catch (e) {
    res.status(502).json({ error: "Gagal mengambil arsip FIRMS: " + e.message });
  }
}

module.exports = handler;
