import { NextResponse } from 'next/server';
import crypto from 'crypto';

type Balance    = { symbol: string; available: string; inOrder: string };
type TickerResp = { price?: string; errorCode?: number; message?: string };

export async function GET() {
  const apiKey    = process.env.BITVAVO_API_KEY;
  const apiSecret = process.env.BITVAVO_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({
      error: 'Bitvavo API keys niet ingesteld in Netlify environment variables.',
      keys_present: { BITVAVO_API_KEY: !!apiKey, BITVAVO_API_SECRET: !!apiSecret },
    }, { status: 500 });
  }

  const timestamp = Date.now();
  const method    = 'GET';
  const path      = '/v2/balance';

  /* Bitvavo signature: HMAC-SHA256(timestamp + method + path, secret) */
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(`${timestamp}${method}${path}`)
    .digest('hex');

  let balanceResp: Response;
  try {
    balanceResp = await fetch(`https://api.bitvavo.com${path}`, {
      headers: {
        'Bitvavo-Access-Key':       apiKey,
        'Bitvavo-Access-Signature': signature,
        'Bitvavo-Access-Timestamp': String(timestamp),
        'Bitvavo-Access-Window':    '10000',
        'Content-Type':             'application/json',
      },
    });
  } catch (networkErr) {
    return NextResponse.json({ error: 'Kon Bitvavo niet bereiken: ' + String(networkErr) }, { status: 503 });
  }

  const raw: Balance[] | { errorCode?: number; message?: string } = await balanceResp.json();

  if (!Array.isArray(raw)) {
    const errObj = raw as { errorCode?: number; message?: string };
    let hint = '';
    if (errObj.errorCode === 103) hint = 'Ongeldige handtekening — controleer BITVAVO_API_SECRET.';
    else if (errObj.errorCode === 105) hint = 'API key niet gevonden — controleer BITVAVO_API_KEY.';
    else if (errObj.errorCode === 107) hint = 'API key heeft geen lees-rechten. Zet "View" toe in Bitvavo API instellingen.';
    return NextResponse.json({
      error: errObj.message ?? 'Bitvavo API fout',
      code:  errObj.errorCode,
      hint:  hint || 'Controleer je Bitvavo API key en secret in Netlify.',
    }, { status: 502 });
  }

  /* Filter actieve saldi */
  const actief = raw.filter(b => parseFloat(b.available) + parseFloat(b.inOrder) > 0.0001);

  /* Haal EUR prijzen op in parallel */
  const coins = await Promise.all(actief.map(async b => {
    const hoeveelheid = parseFloat(b.available) + parseFloat(b.inOrder);
    if (b.symbol === 'EUR') {
      return { symbol:'EUR', naam:'Euro', hoeveelheid, prijs:1, waarde:hoeveelheid };
    }
    try {
      const r = await fetch(`https://api.bitvavo.com/v2/ticker/price?market=${b.symbol}-EUR`);
      const t: TickerResp = await r.json();
      const prijs = parseFloat(t.price ?? '0');
      return { symbol:b.symbol, naam:b.symbol, hoeveelheid, prijs, waarde: hoeveelheid * prijs };
    } catch {
      return { symbol:b.symbol, naam:b.symbol, hoeveelheid, prijs:0, waarde:0 };
    }
  }));

  const totaal = coins.reduce((s, c) => s + c.waarde, 0);
  return NextResponse.json({ coins: coins.sort((a, b) => b.waarde - a.waarde), totaal });
}
