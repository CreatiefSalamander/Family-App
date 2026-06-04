import { NextRequest, NextResponse } from 'next/server';

type ForecastItem = {
  dt_txt: string;
  main: { temp: number };
  weather: { description: string; icon: string }[];
};

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, stad } = await req.json();
    const key = process.env.OPENWEATHER_API_KEY;
    if (!key) return NextResponse.json({ error: 'OPENWEATHER_API_KEY niet ingesteld' }, { status: 500 });

    const base = 'https://api.openweathermap.org/data/2.5';
    const huidigUrl = lat && lng
      ? `${base}/weather?lat=${lat}&lon=${lng}&appid=${key}&units=metric&lang=nl`
      : `${base}/weather?q=${encodeURIComponent(stad ?? 'Amsterdam')}&appid=${key}&units=metric&lang=nl`;

    const huidigResp = await fetch(huidigUrl);
    const huidig = await huidigResp.json();

    if (huidig.cod !== 200) {
      return NextResponse.json({ error: huidig.message ?? 'Stad niet gevonden' }, { status: 404 });
    }

    const forecastUrl = `${base}/forecast?lat=${huidig.coord.lat}&lon=${huidig.coord.lon}&appid=${key}&units=metric&lang=nl&cnt=8`;
    const forecastResp = await fetch(forecastUrl);
    const forecastData = await forecastResp.json();

    return NextResponse.json({
      stad:          huidig.name,
      land:          huidig.sys?.country,
      temp:          Math.round(huidig.main?.temp),
      feelsLike:     Math.round(huidig.main?.feels_like),
      beschrijving:  huidig.weather?.[0]?.description ?? '',
      icoon:         huidig.weather?.[0]?.icon ?? '',
      luchtvochtigheid: huidig.main?.humidity,
      windsnelheid:  huidig.wind?.speed,
      lat:           huidig.coord.lat,
      lng:           huidig.coord.lon,
      forecast: ((forecastData.list ?? []) as ForecastItem[]).slice(0, 8).map(f => ({
        tijd:        f.dt_txt,
        temp:        Math.round(f.main.temp),
        beschrijving:f.weather[0]?.description ?? '',
        icoon:       f.weather[0]?.icon ?? '',
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
