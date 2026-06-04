import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

const TYPES: Record<string, string> = {
  supermarkt:  'supermarket',
  tankstation: 'gas_station',
  restaurant:  'restaurant',
  apotheek:    'pharmacy',
  bank:        'bank',
  geldautomaat:'atm',
};

type PlaceResult = {
  name: string;
  vicinity: string;
  rating?: number;
  opening_hours?: { open_now?: boolean };
  geometry: { location: { lat: number; lng: number } };
  place_id: string;
};

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const { lat, lng, type = 'supermarkt', radius = 2000 } = await req.json();
    if (!lat || !lng) return NextResponse.json({ error: 'lat en lng vereist' }, { status: 400 });

    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key) return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY niet ingesteld' }, { status: 500 });

    const placeType = TYPES[type] ?? 'supermarket';
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${placeType}&language=nl&key=${key}`;

    const resp = await fetch(url);
    const data = await resp.json();

    if (data.status === 'REQUEST_DENIED') {
      return NextResponse.json({
        error: 'Google Places API geweigerd. Controleer of de Places API is ingeschakeld in Google Cloud Console.',
        detail: data.error_message,
      }, { status: 403 });
    }

    const resultaten = ((data.results ?? []) as PlaceResult[]).slice(0, 10).map(p => ({
      naam:    p.name,
      adres:   p.vicinity,
      rating:  p.rating ?? null,
      open:    p.opening_hours?.open_now ?? null,
      lat:     p.geometry.location.lat,
      lng:     p.geometry.location.lng,
      placeId: p.place_id,
      type:    placeType,
    }));

    return NextResponse.json({ resultaten });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
