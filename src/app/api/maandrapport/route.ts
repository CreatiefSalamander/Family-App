import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { maand, jaar, inkomsten, uitgaven, schulden, doelen, topCategorieen, netto } = await req.json();

    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Maak een professioneel financieel maandrapport in het Nederlands.

FINANCIËLE DATA:
- Maand: ${maand} ${jaar}
- Inkomsten: €${inkomsten}
- Uitgaven: €${uitgaven}
- Netto: €${netto}
- Totale schulden: €${schulden}
- Top uitgaven: ${topCategorieen}
- Doelen voortgang: ${doelen}

Schrijf een beknopt rapport met:
1. Samenvatting van de maand (2-3 zinnen)
2. Positieve punten (2-3 bullets)
3. Aandachtspunten (1-2 bullets)
4. Concrete tips voor volgende maand (2-3 bullets)
5. Korte schulden analyse

Formatteer als nette HTML met inline CSS. Gebruik een professionele opmaak met secties en kleuren.
Gebruik: font-family: Inter, sans-serif; max-width: 700px; color: #1A1F36.
Secties in het blauw (#0179FE), positief in groen (#22C55E), aandacht in oranje (#F59E0B).`,
      }],
    });

    const html = response.content[0].type === 'text' ? response.content[0].text : '<p>Rapport kon niet worden gegenereerd.</p>';
    return NextResponse.json({ html });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
