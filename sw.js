// Pantau Karhutla service worker: app shell offline, data selalu dari jaringan.
const VERSION = "pk-20261104b";
const SHELL = ["/", "/favicon.svg", "/favicon-32.png", "/icon-192.png", "/site.webmanifest"];
const STATIC_HOSTS = ["cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  // Live data & third-party APIs: always network (never serve stale hotspots).
  if (same && (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_vercel/"))) return;
  if (!same && !STATIC_HOSTS.includes(url.hostname)) return;
  if (req.mode === "navigate") {
    // Network first for the page; fall back to the cached shell when offline.
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put("/", cp)); return r; }).catch(() => caches.match("/")));
    return;
  }
  // Static files: stale-while-revalidate.
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req);
    const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const w of list) { if ("focus" in w) { w.navigate(target).catch(() => {}); return w.focus(); } }
    return self.clients.openWindow(target);
  }));
});
