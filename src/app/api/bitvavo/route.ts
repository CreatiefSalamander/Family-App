import { NextResponse } from 'next/server';
import crypto from 'crypto';

type Balance = { symbol: string; available: string; inOrder: string };
type TickerPrice = { market: string; price: string };

export async function GET() {
  try {
    const apiKey    = process.env.BITVAVO_API_KEY;
    const apiSecret = process.env.BITVAVO_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Bitvavo API keys niet ingesteld' }, { status: 500 });
    }

    const timestamp = Date.now();
    const method    = 'GET';
    const path      = '/v2/balance';

    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(`${timestamp}${method}${path}`)
      .digest('hex');

    const resp = await fetch(`https://api.bitvavo.com${path}`, {
      headers: {
        'Bitvavo-Access-Key':       apiKey,
        'Bitvavo-Access-Signature': signature,
        'Bitvavo-Access-Timestamp': String(timestamp),
        'Bitvavo-Access-Window':    '10000',
      },
    });

    const balances: Balance[] = await resp.json();
    if (!Array.isArray(balances)) {
      return NextResponse.json({ error: 'Bitvavo API fout', detail: balances }, { status: 502 });
    }

    /* Filter op coins met een positief saldo */
    const actief = balances.filter(b => parseFloat(b.available) + parseFloat(b.inOrder) > 0);

    /* Haal prijzen op in parallel */
    const coins = await Promise.all(actief.map(async b => {
      const hoeveelheid = parseFloat(b.available) + parseFloat(b.inOrder);
      if (b.symbol === 'EUR') return { symbol: 'EUR', naam: 'Euro', hoeveelheid, prijs: 1, waarde: hoeveelheid };

      try {
        const tickerResp = await fetch(`https://api.bitvavo.com/v2/ticker/price?market=${b.symbol}-EUR`);
        const ticker: TickerPrice = await tickerResp.json();
        const prijs = parseFloat(ticker.price ?? '0');
        return { symbol: b.symbol, naam: b.symbol, hoeveelheid, prijs, waarde: hoeveelheid * prijs };
      } catch {
        return { symbol: b.symbol, naam: b.symbol, hoeveelheid, prijs: 0, waarde: 0 };
      }
    }));

    const totaal = coins.reduce((s, c) => s + c.waarde, 0);
    return NextResponse.json({ coins: coins.sort((a, b) => b.waarde - a.waarde), totaal });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
