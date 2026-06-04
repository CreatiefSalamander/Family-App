/**
 * Push notificaties helper
 *
 * VOLLEDIG OPTIONEEL — als Firebase keys niet ingesteld zijn
 * worden alle functies stilletjes genegeerd (geen errors).
 *
 * Vereiste Netlify env vars:
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 *   NEXT_PUBLIC_FIREBASE_VAPID_KEY
 *   FCM_SERVER_KEY  (alleen server-side)
 */

const FIREBASE_CONFIGURED = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID
);

/** Vraag browser push toestemming + haal FCM token op */
export async function requestPushPermission(): Promise<string | null> {
  if (!FIREBASE_CONFIGURED || typeof window === 'undefined') return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const { initializeApp, getApps } = await import('firebase/app');
    const { getMessaging, getToken } = await import('firebase/messaging');

    const firebaseConfig = {
      apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const app       = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    const token     = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
    return token;
  } catch {
    return null;
  }
}

/** Sla push token op in Supabase */
export async function savePushToken(token: string, userId: string): Promise<void> {
  if (!token || !userId) return;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await sb.from('push_tokens').upsert(
      { user_id: userId, token, platform: 'web', updated_at: new Date().toISOString() },
      { onConflict: 'user_id,token' }
    );
  } catch { /* stil negeren */ }
}

/** Stuur push notificatie via server-side API */
export async function sendPushNotification(params: {
  userId: string;
  title:  string;
  body:   string;
  url?:   string;
}): Promise<void> {
  try {
    await fetch('/api/notifications/send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(params),
    });
  } catch { /* stil negeren */ }
}

export { FIREBASE_CONFIGURED };
