import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PROMPT = `Analyseer dit financieel document en extraheer ALLE transacties.
Geef terug als JSON array (niets anders, geen uitleg):
[{"datum":"YYYY-MM-DD","omschrijving":"...","bedrag":0.00,"categorie":"..."}]

Regels:
- datum altijd YYYY-MM-DD formaat
- bedrag positief = inkomst, negatief = uitgave
- categorie kies uit: Boodschappen, Transport, Wonen, Gezondheid, Inkomen, Zakelijk, Belasting, Schulden, Overig
- geef ALLEEN de JSON array terug, niets anders`;

export async function POST(req: NextRequest) {
  try {
    const { base64, mediaType, tekst } = await req.json();

    let response;

    if (tekst) {
      /* Word/tekst document */
      response = await anthropic.messages.create({
        model:      'claude-sonnet-4-5',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `${PROMPT}\n\nDOCUMENT INHOUD:\n${tekst}`,
        }],
      });
    } else if (base64 && mediaType === 'application/pdf') {
      /* PDF document via vision */
      response = await anthropic.messages.create({
        model:      'claude-sonnet-4-5',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            {
              type:   'document' as const,
              source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 },
            },
            { type: 'text' as const, text: PROMPT },
          ],
        }],
      });
    } else {
      return NextResponse.json({ error: 'base64 (PDF) of tekst (Word) vereist' }, { status: 400 });
    }

    const raw  = response.content?.[0];
    const text = raw?.type === 'text' ? raw.text : '';

    /* Extraheer JSON uit het antwoord */
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return NextResponse.json({ error: 'Geen transacties gevonden in document', raw: text }, { status: 422 });
    }

    const transacties = JSON.parse(match[0]);
    return NextResponse.json({ transacties, totaal: transacties.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Onbekende fout';
    console.error('[analyze-document]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
