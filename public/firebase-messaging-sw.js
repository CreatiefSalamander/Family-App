/* Firebase Messaging Service Worker
 * Verwerkt achtergrond push notificaties.
 * Wordt automatisch geregistreerd door Firebase SDK.
 */

importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

/* Config wordt injecteerd via window.__FIREBASE_CONFIG__ of env vars */
const firebaseConfig = self.__FIREBASE_CONFIG__ || {
  apiKey:            '{{NEXT_PUBLIC_FIREBASE_API_KEY}}',
  authDomain:        '{{NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}}',
  projectId:         '{{NEXT_PUBLIC_FIREBASE_PROJECT_ID}}',
  storageBucket:     '{{NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}}',
  messagingSenderId: '{{NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}}',
  appId:             '{{NEXT_PUBLIC_FIREBASE_APP_ID}}',
};

/* Initialiseer alleen als config geldig is */
if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('{{')) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const { title, body, icon } = payload.notification || {};
    const url = payload.data?.url || '/home';

    self.registration.showNotification(title || 'Household', {
      body:    body || '',
      icon:    icon || '/icons/icon-192.png',
      badge:   '/icons/badge-72.png',
      data:    { url },
      actions: [
        { action: 'open',  title: 'Openen'  },
        { action: 'close', title: 'Sluiten' },
      ],
      vibrate: [100, 50, 100],
    });
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data?.url || '/home';
    event.waitUntil(clients.openWindow(url));
  }
});
