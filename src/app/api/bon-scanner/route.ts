import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth } from '@/lib/api-auth';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const { base64, mediaType = 'image/jpeg' } = await req.json();
    if (!base64) return NextResponse.json({ error: 'base64 afbeelding vereist' }, { status: 400 });

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
