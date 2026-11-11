// Shared request checks for the serverless functions (files starting with "_" are not deployed as routes).
// - Only GET/HEAD.
// - Only the expected query parameters: random extra parameters would bypass the edge cache and
//   let anyone burn through the NASA FIRMS key quota, so they are rejected.
function guard(req, res, allowed) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).json({ error: "Metode tidak diizinkan." });
    return false;
  }
  const extra = Object.keys(req.query || {}).filter(k => !allowed.includes(k));
  if (extra.length) {
    res.status(400).json({ error: "Parameter tidak dikenal." });
    return false;
  }
  return true;
}
module.exports = guard;
