import { NextRequest, NextResponse } from 'next/server';

const POPULAIR = ['USD','GBP','TRY','AMD','AED','JPY','CHF','SEK','PLN','HUF','DKK','NOK'];

export async function POST(req: NextRequest) {
  try {
    const { van = 'EUR', naar } = await req.json();
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
