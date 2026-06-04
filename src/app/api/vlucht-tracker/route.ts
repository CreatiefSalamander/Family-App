import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const { vluchtnummer } = await req.json();
    if (!vluchtnummer) return NextResponse.json({ error: 'vluchtnummer vereist' }, { status: 400 });

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
        iata:       vlucht.arrival?.iata ?? '',
        gepland:    vlucht.arrival?.scheduled ?? '',
        verwacht:   vlucht.arrival?.estimated ?? '',
        gate:       vlucht.arrival?.gate ?? '',
        terminal:   vlucht.arrival?.terminal ?? '',
      },
      vertraging: vlucht.departure?.delay ?? 0,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
