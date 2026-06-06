import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const Schema = z.object({
  base64:    z.string().min(1),
  mediaType: z.string().optional(),
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  // Max 5 bon-scans per minuut per gebruiker (vision API is duur)
  const rl = await checkRateLimit(authResult.user.id, 'bon-scanner', 5);
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
    const { base64, mediaType = 'image/jpeg' } = body;

    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-5',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          {
            type:   'image',
            source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64 },
          },
          {
            type: 'text',
            text: `Analyseer deze kassabon/bon en extraheer de informatie.
Geef ALLEEN een JSON object terug (geen uitleg):
{"winkel":"naam van de winkel","datum":"YYYY-MM-DD","bedrag":0.00,"categorie":"Boodschappen|Eten|Auto|Gezondheid|Kleding|Overig"}

Als je de datum niet kunt lezen, gebruik dan vandaag: ${new Date().toISOString().split('T')[0]}
Het bedrag is het totaalbedrag in euros (getal zonder € teken).`,
          },
        ],
      }],
    });

    const tekst = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const clean = tekst.replace(/```json|```/g, '').trim();
    const data  = JSON.parse(clean);

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
