/* Macrociclos AKC: guarda la app para abrirla sin conexión. Los datos (Drive) siempre se piden en línea;
   si no hay conexión se usa la copia del MACRO incluida en la app. Subir VERSION al cambiar archivos. */
const VERSION = "macro-v6";
const ARCHIVOS = ["./", "index.html", "manifest.webmanifest", "css/app.css", "js/config.js", "js/fechas.js", "js/modelo.js", "js/lector.js",
  "js/generador.js", "js/excel.js", "js/guardar-drive.js", "js/vista.js", "js/app.js", "assets/MACRO_26_27.xlsx", "assets/aguilas-kc-logo.png",
  "iconos/icono-192.png", "iconos/favicon-32.png", "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js", "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"];
self.addEventListener("install", e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || /googleapis\.com|accounts\.google\.com|gstatic\.com|fonts\./.test(u.host)) return;   // Drive y Google: siempre en línea
  // Primero la red (para tener siempre lo último); si no hay conexión, la copia guardada
  e.respondWith(fetch(e.request).then(r => { if (r.ok && (u.origin === location.origin || u.host === "cdnjs.cloudflare.com")) { const c = r.clone(); caches.open(VERSION).then(k => k.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
