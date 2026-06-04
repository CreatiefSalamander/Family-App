import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { subscription, userId } = await req.json();

    if (!subscription?.endpoint || !userId) {
      return NextResponse.json({ error: 'subscription en userId vereist' }, { status: 400 });
    }

    /* Sla op als JSON string in push_tokens.token kolom */
    const token = JSON.stringify(subscription);

    await sb.from('push_tokens').upsert(
      {
        user_id:    userId,
        token,
        platform:   'web-push',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
