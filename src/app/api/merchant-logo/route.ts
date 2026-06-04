import { NextRequest, NextResponse } from 'next/server';

/* Naam → domein mapping */
const NAAM_DOMEIN: Record<string, string> = {
  'albert heijn': 'ah.nl',
  'ah':            'ah.nl',
  'jumbo':         'jumbo.com',
  'lidl':          'lidl.nl',
  'aldi':          'aldi.nl',
  'plus':          'plus.nl',
  'action':        'action.com',
  'bol.com':       'bol.com',
  'bol':           'bol.com',
  'amazon':        'amazon.nl',
  'netflix':       'netflix.com',
  'spotify':       'spotify.com',
  'disney':        'disneyplus.com',
  'prime video':   'amazon.com',
  'ns':            'ns.nl',
  'ns ov':         'ns.nl',
  'shell':         'shell.com',
  'bp':            'bp.com',
  'esso':          'esso.nl',
  'eneco':         'eneco.nl',
  'vattenfall':    'vattenfall.nl',
  'essent':        'essent.nl',
  'kpn':           'kpn.com',
  'vodafone':      'vodafone.nl',
  't-mobile':      't-mobile.nl',
  'ziggo':         'ziggo.nl',
  'ikea':          'ikea.com',
  'zara':          'zara.com',
  'h&m':           'hm.com',
  'coolblue':      'coolblue.nl',
  'mediamarkt':    'mediamarkt.nl',
  'decathlon':     'decathlon.nl',
  'hema':          'hema.nl',
  'primark':       'primark.com',
  'starbucks':     'starbucks.com',
  'mcdonalds':     'mcdonalds.nl',
  "mcdonald's":   'mcdonalds.nl',
  'ing':           'ing.nl',
  'rabobank':      'rabobank.nl',
  'abn amro':      'abnamro.nl',
};

function naamNaarDomein(naam: string): string | null {
  const lower = naam.toLowerCase().trim();
  for (const [key, domein] of Object.entries(NAAM_DOMEIN)) {
    if (lower.includes(key)) return domein;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { naam } = await req.json();
    const domein   = naamNaarDomein(naam ?? '');

    if (!domein) {
      return NextResponse.json({ logoUrl: null, domein: null });
    }

    /* Brandfetch API — haal merkinformatie op */
    const apiResp = await fetch(`https://api.brandfetch.io/v2/brands/${domein}`, {
      headers: { Authorization: `Bearer ${process.env.BRANDFETCH_KEY}` },
    });

    if (!apiResp.ok) {
      /* Fallback naar CDN zonder auth */
      const cdnUrl = `https://cdn.brandfetch.io/${domein}/w/64/h/64`;
      return NextResponse.json({ logoUrl: cdnUrl, domein });
    }

    const brand = await apiResp.json();
    const logo  = brand.logos?.[0]?.formats?.find((f: { format: string }) => f.format === 'png')?.src
               ?? brand.logos?.[0]?.formats?.[0]?.src
               ?? `https://cdn.brandfetch.io/${domein}/w/64/h/64`;

    return NextResponse.json({ logoUrl: logo, domein, naam: brand.name });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Fout';
    return NextResponse.json({ logoUrl: null, error: msg });
  }
}
