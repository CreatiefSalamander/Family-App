/* ══════════════════════════════════════════════════════════
 * Household — Web Push Service Worker (VAPID, geen Firebase)
 * Geregistreerd via src/lib/push-web.ts
 * ══════════════════════════════════════════════════════════ */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

/* ── Push ontvangen ─────────────────────────────────────── */
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() ?? {}; } catch { data = { title: event.data?.text() }; }

  const title   = data.title   ?? 'Household';
  const body    = data.body    ?? '';
  const icon    = data.icon    ?? '/icons/icon-192.png';
  const badge   = data.badge   ?? '/icons/badge-72.png';
  const url     = data.url     ?? '/home';
  const tag     = data.tag     ?? 'household-notif';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      data:    { url },
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open',  title: '📱 Openen'  },
        { action: 'close', title: '✕ Sluiten'  },
      ],
    })
  );
});

/* ── Notificatie klik ───────────────────────────────────── */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'close') return;

  const url = event.notification.data?.url ?? '/home';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      /* Focus bestaand venster als het de juiste URL heeft */
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      /* Anders nieuw venster openen */
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
