import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const Schema = z.object({
  base64:    z.string().optional(),
  mediaType: z.string().optional(),
  tekst:     z.string().max(100000).optional(),
}).refine(d => d.tekst || d.base64, {
  message: 'base64 (PDF) of tekst (Word) vereist',
});

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
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  // Max 5 document-analyses per minuut per gebruiker (zwaarste Anthropic call)
  const rl = await checkRateLimit(authResult.user.id, 'analyze-document', 5);
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
    const { base64, mediaType, tekst } = body;

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
      return NextResponse.json({ error: 'Geen transacties gevo