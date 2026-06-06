import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const Schema = z.object({
  van:   z.string().length(3).optional(),
  naar:  z.string().length(3).optional(),
  bedrag: z.number().min(0).optional(),
});

const POPULAIR = ['USD','GBP','TRY','AMD','AED','JPY','CHF','SEK','PLN','HUF','DKK','NOK'];

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  // Max 30 wisselkoersopvragingen per minuut per gebruiker
  const rl = checkRateLimit(authResult.user.id, 'wisselkoers', 30);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Te veel verzoeken. Probeer over ${Math.ceil(rl.resetIn / 1000)} seconden opnieuw.` },
      { status: 429 },
    );
  }

  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: 'Ongeldige invoer — controleer de verstuurde velden' },
      { status: 400 }
    );
  }

  try {
    const { van = 'EUR', naar } = body;
    const resp = await fetch(`https://open.er-api.com/v6/latest/${van}`);
    const data = await resp.json();

    if (data.result !== 'success') {
      return NextResponse.json({ error: 'Wisselkoers API fout' }, { status: 502 });
    }

    if (naar) {
      return NextResponse.json({
        van, naar,
        koers: data.rates[naar] ?? null,
        datum: data.time_last_update_utc,
      });
    }

    const koersen: Record<string, number> = {};
    for (const code of POPULAIR) {
      if (data.rates[code]) koersen[code] = data.rates[code];
    }

    return NextResponse.json({ van, koersen, datum: data.time_last_update_utc });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
