import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { z } from 'zod';

const Schema = z.object({
  product: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

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
    const { product } = body;

    const params = new URLSearchParams({
      q:       product + ' prijs nederland',
      api_key: process.env.SERPAPI_KEY!,
      engine:  'google_shopping',
      gl:      'nl',
      hl:      'nl',
      num:     '8',
    });

    const resp = await fetch(`https://serpapi.com/search?${params}`);
    if (!resp.ok) {
      throw new Error(`SerpAPI HTTP ${resp.status}`);
    }

    const data = await resp.json();

    type ShopItem = { title?:string; price?:string; extracted_price?:number; source?:string; link?:string; thumbnail?:string; rating?:number; reviews?:number };
    const resultaten = ((data.shopping_results || []) as ShopItem[])
      .slice(0, 8)
      .map((item) => ({
        titel:      item.title      ?? '',
        prijs:      item.price      ?? '',
        prijsRaw:   item.extracted_price ?? null,
        winkel:     item.source     ?? '',
        link:       item.link       ?? '#',
        afbeelding: item.thumbnail  ?? null,
        rating:     item.rating     ?? null,
        reviews:    item.reviews    ?? null,
      }));

    return NextResponse.json({ resultaten, totaal: resultaten.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Onbekende fout';
    console.error('[zoek-prijs]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
