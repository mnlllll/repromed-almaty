self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const payload = event.data;
  if (!payload || payload.type !== 'SHOW_VISIT_REMINDER') return;

  const title = payload.title || 'Напоминание о визите — Репро-Мед Алматы';
  const options = {
    body: payload.body || 'Прием в медицинском центре Репро-Мед (пр. Райымбека, 150)',
    tag: payload.tag || 'repromed-visit',
    renotify: true,
    requireInteraction: false,
    vibrate: [150, 80, 150],
    data: {
      url: payload.url || '/#services',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : 'Напоминание о записи в Репро-Мед' };
  }

  const title = data.title || 'Медицинский центр Репро-Мед';
  const options = {
    body: data.body || 'Напоминание о записи на прием (пр. Райымбека, 150)',
    tag: data.tag || 'repromed-push',
    renotify: true,
    data: { url: data.url || '/#services' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/#services';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
