import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const Schema = z.object({
  vluchtnummer: z.string().min(2).max(10),
});

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  // Max 30 vluchtzoekopdrachten per minuut per gebruiker
  const rl = await checkRateLimit(authResult.user.id, 'vlucht-tracker', 30);
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
    const { vluchtnummer } = body;

    const key = process.env.AVIATIONSTACK_KEY;
    if (!key) return NextResponse.json({ error: 'AVIATIONSTACK_KEY niet ingesteld' }, { status: 500 });

    const url = `https://api.aviationstack.com/v1/flights?access_key=${key}&flight_iata=${vluchtnummer.toUpperCase()}`;
    const resp = await fetch(url);
    const data = await resp.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message ?? 'API fout' }, { status: 502 });
    }

    const vlucht = data.data?.[0];
    if (!vlucht) return NextResponse.json({ error: 'Vlucht niet gevonden' }, { status: 404 });

    return NextResponse.json({
      vluchtnummer: vlucht.flight?.iata ?? vluchtnummer,
      maatschappij: vlucht.airline?.name ?? '',
      status:       vlucht.flight_status ?? 'onbekend',
      vertrek: {
        luchthaven: vlucht.departure?.airport ?? '',
        iata:       vlucht.departure?.iata ?? '',
        gepland:    vlucht.departure?.scheduled ?? '',
        werkelijk:  vlucht.departure?.actual ?? '',
        gate:       vlucht.departure?.gate ?? '',
        terminal:   vlucht.departure?.terminal ?? '',
      },
      aankomst: {
        luchthaven: vlucht.arrival?.airport ?? '',
        iata:       vlucht.arrival?.iata ?? ''