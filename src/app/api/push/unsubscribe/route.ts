import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ error: 'endpoint vereist' }, { status: 400 });

    /* Verwijder alle tokens die deze endpoint bevatten */
    const { data: tokens } = await sb
      .from('push_tokens')
      .select('id, token')
      .like('token', `%${endpoint.replace(/[%_]/g, '\\$&')}%`);

    if (tokens?.length) {
      await sb.from('push_tokens').delete().in('id', tokens.map(t => t.id));
    }

    return NextResponse.json({ ok: true, verwijderd: tokens?.length ?? 0 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
