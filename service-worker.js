// Service worker de La Bici — cachea el "shell" de la app (HTML, manifest, íconos)
// para que cargue rápido en visitas repetidas. Los datos de Supabase y el mapa
// de Google siguen pidiéndose siempre en vivo (no tiene sentido cachear eso,
// necesitamos los locales actualizados y el mapa necesita conexión igual).

const CACHE_NAME = "la-bici-shell-v1";
const ARCHIVOS_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          .filter((nombre) => nombre !== CACHE_NAME)
          .map((nombre) => caches.delete(nombre))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Solo interceptamos pedidos a nuestro propio sitio (shell).
  // Todo lo demás (Supabase, Google Maps, fuentes) pasa directo a la red.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cacheado) => {
      return (
        cacheado ||
        fetch(event.request).then((respuesta) => {
          const clone = respuesta.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return respuesta;
        })
      );
    })
  );
});
