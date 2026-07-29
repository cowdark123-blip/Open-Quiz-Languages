self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Claim clients so the service worker takes control immediately
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Empty fetch handler is enough for Chromium PWA install criteria
});
