import { NextRequest, NextResponse } from 'next/server';
import webPush from 'web-push';
import { createClient } from '@supabase/supabase-js';

/* VAPID configuratie */
const PUBLIC_KEY  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const MAILTO      = process.env.VAPID_MAILTO ?? 'mailto:noreply@household.app';

if (PUBLIC_KEY && PRIVATE_KEY) {
  webPush.setVapidDetails(
    MAILTO.startsWith('mailto:') ? MAILTO : `mailto:${MAILTO}`,
    PUBLIC_KEY,
    PRIVATE_KEY,
  );
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface PushPayload {
  title:  string;
  body:   string;
  icon?:  string;
  badge?: string;
  url?:   string;
  tag?:   string;
}

export async function POST(req: NextRequest) {
  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    return NextResponse.json({ error: 'VAPID keys niet ingesteld' }, { status: 503 });
  }

  try {
    const { userId, title, body, url, icon, tag } = await req.json() as { userId: string } & PushPayload;

    if (!userId || !title) {
      return NextResponse.json({ error: 'userId en title vereist' }, { status: 400 });
    }

    /* Haal alle push subscriptions op voor deze gebruiker */
    const { data: tokens, error: dbErr } = await sb
      .from('push_tokens')
      .select('id, token')
      .eq('user_id', userId)
      .eq('platform', 'web-push');

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    if (!tokens?.length) return NextResponse.json({ skipped: true, reason: 'Geen subscriptions' });

    const payload: PushPayload = {
      title,
      body,
      icon:  icon  ?? '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      url:   url   ?? '/home',
      tag:   tag   ?? 'household',
    };

    const results = await Promise.allSettled(
      tokens.map(async ({ id, token }) => {
        let subscription: webPush.PushSubscription;
        try {
          subscription = JSON.parse(token) as webPush.PushSubscription;
        } catch {
          /* Verwijder ongeldige token */
          await sb.from('push_tokens').delete().eq('id', id);
          throw new Error('Ongeldige token JSON');
        }

        try {
          await webPush.sendNotification(subscription, JSON.stringify(payload));
          return { id, ok: true };
        } catch (err: unknown) {
          /* 410 Gone = subscription verlopen → verwijderen */
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 410 || statusCode === 404) {
            await sb.from('push_tokens').delete().eq('id', id);
          }
          throw err;
        }
      })
    );

    const verzonden  = results.filter(r => r.status === 'fulfilled').length;
    const mislukt    = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({ verzonden, mislukt, totaal: tokens.length });
  } catch (err) {
    console.error('[push/send]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
