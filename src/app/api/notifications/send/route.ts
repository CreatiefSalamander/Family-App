import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const serverKey = process.env.FCM_SERVER_KEY;
  if (!serverKey) {
    return NextResponse.json({ skipped: true, reason: 'FCM_SERVER_KEY niet ingesteld' });
  }

  try {
    const { title, body, url = '/home' } = await req.json();
    const userId = authResult.user.id; // altijd eigen user, nooit uit body
    if (!title) {
      return NextResponse.json({ error: 'title vereist' }, { status: 400 });
    }

    /* Haal FCM token op uit Supabase */
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: tokens } = await sb
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId);

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ skipped: true, reason: 'Geen push tokens gevonden' });
    }

    /* Stuur naar FCM */
    const results = await Promise.all(
      tokens.map(async ({ token }: { token: string }) => {
        const resp = await fetch('https://fcm.googleapis.com/fcm/send', {
          method:  'POST',
          headers: {
            Authorization:  `key=${serverKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to:           token,
            notification: { title, body, icon: '/icons/icon-192.png', click_action: url },
            data:         { url },
          }),
        });
        return resp.ok;
      })
    );

    return NextResponse.json({ sent: results.filter(Boolean).length, total: tokens.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
