/**
 * Web Push helper — VAPID, geen Firebase
 *
 * Gebruik:
 *   const sub = await subscribeToPush();
 *   if (sub) await savePushSubscription(sub, userId);
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

/** Converteer base64url string naar Uint8Array (nodig voor VAPID) */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

/** Registreer service worker + vraag push toestemming */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[push] Browser ondersteunt geen Web Push');
    return null;
  }
  if (!PUBLIC_KEY) {
    console.warn('[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY niet ingesteld');
    return null;
  }

  try {
    /* Vraag toestemming */
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    /* Registreer service worker */
    const reg = await navigator.serviceWorker.register('/push-sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    /* Bestaand abonnement hergebruiken of nieuw aanmaken */
    const bestaand = await reg.pushManager.getSubscription();
    if (bestaand) return bestaand;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY) as unknown as ArrayBuffer,
    });
    return sub;
  } catch (err) {
    console.error('[push] Subscribe fout:', err);
    return null;
  }
}

/** Sla push subscription op in Supabase push_tokens tabel */
export async function savePushSubscription(
  sub:    PushSubscription,
  userId: string
): Promise<void> {
  try {
    await fetch('/api/push/subscribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ subscription: sub.toJSON(), userId }),
    });
  } catch (err) {
    console.error('[push] Opslaan mislukt:', err);
  }
}

/** Huidige toestemmingsstatus ophalen */
export function getPushStatus(): 'supported' | 'granted' | 'denied' | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window))   return 'unsupported';
  if (!PUBLIC_KEY)                   return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied')  return 'denied';
  return 'supported';
}

/** Uitschrijven + token verwijderen */
export async function unsubscribeFromPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/push-sw.js');
    const sub = await reg?.pushManager?.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      await fetch('/api/push/unsubscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ endpoint: sub.endpoint }),
      });
    }
  } catch (err) {
    console.error('[push] Uitschrijven mislukt:', err);
  }
}
