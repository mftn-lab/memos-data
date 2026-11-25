/* Service worker des Mémos Data : hors ligne et mises à jour. Version : f0bbb490ef */
const CACHE = "memos-f0bbb490ef", PDFC = "memos-pdf", FONTS = "memos-fonts";
const CORE = ["./", "index.html", "python.html", "pandas-nettoyage.html", "git.html", "favoris.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png"];
const PDFS = ["pdf/memo-git-1-le-terminal-court.pdf", "pdf/memo-git-1-le-terminal.pdf", "pdf/memo-git-2-vs-code-court.pdf", "pdf/memo-git-2-vs-code.pdf", "pdf/memo-git-3-environnement-virtuel-court.pdf", "pdf/memo-git-3-environnement-virtuel.pdf", "pdf/memo-git-4-git-en-local-court.pdf", "pdf/memo-git-4-git-en-local.pdf", "pdf/memo-git-5-github-et-equipe-court.pdf", "pdf/memo-git-5-github-et-equipe.pdf", "pdf/memo-git-court.pdf", "pdf/memo-git.pdf", "pdf/memo-pandas-1-commencer-court.pdf", "pdf/memo-pandas-1-commencer.pdf", "pdf/memo-pandas-2-nettoyer-court.pdf", "pdf/memo-pandas-2-nettoyer.pdf", "pdf/memo-pandas-3-transformer-court.pdf", "pdf/memo-pandas-3-transformer.pdf", "pdf/memo-pandas-4-analyser-et-finir-court.pdf", "pdf/memo-pandas-4-analyser-et-finir.pdf", "pdf/memo-pandas-court.pdf", "pdf/memo-pandas.pdf", "pdf/memo-python-1-les-bases-court.pdf", "pdf/memo-python-1-les-bases.pdf", "pdf/memo-python-2-controler-le-deroule-court.pdf", "pdf/memo-python-2-controler-le-deroule.pdf", "pdf/memo-python-3-les-structures-de-donnees-court.pdf", "pdf/memo-python-3-les-structures-de-donnees.pdf", "pdf/memo-python-4-structurer-son-code-court.pdf", "pdf/memo-python-4-structurer-son-code.pdf", "pdf/memo-python-court.pdf", "pdf/memo-python.pdf"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("memos-") && ![CACHE, PDFC, FONTS].includes(k)).map((k) => caches.delete(k)));
    await self.clients.claim();
    // les PDF en arrière-plan, pour les ouvrir hors ligne
    const pc = await caches.open(PDFC);
    for (const u of PDFS) { try { if (!(await pc.match(u))) { const r = await fetch(u); if (r.ok) await pc.put(u, r); } } catch (x) {} }
  })());
});
self.addEventListener("fetch", (e) => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(FONTS).then(async (c) => { const hit = await c.match(req); const net = fetch(req).then((r) => { c.put(req, r.clone()); return r; }).catch(() => hit); return hit || net; }));
    return;
  }
  if (url.origin !== location.origin) return;
  if (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/")) {
    // pages : le réseau d'abord (toujours à jour), la copie hors ligne sinon
    e.respondWith(fetch(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return r; })
      .catch(async () => (await caches.match(req, {ignoreSearch: true})) || (await caches.match("index.html"))));
    return;
  }
  if (url.pathname.endsWith(".pdf")) {
    e.respondWith(caches.open(PDFC).then(async (c) => { const hit = await c.match(req, {ignoreSearch: true}); const net = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit); return hit || net; }));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return r; })));
});
