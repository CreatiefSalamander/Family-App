import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const Schema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.union([z.string().min(1).max(10000), z.array(z.any())]),
  })).min(1).max(50),
  tools: z.array(z.any()).optional(),
  system: z.string().max(2000).optional(),
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  // Max 30 berichten per minuut per gebruiker
  if (!checkRateLimit(authResult.user.id, 'ai-chat', 30)) {
    return NextResponse.json(
      { error: 'Te veel verzoeken — wacht even en probeer opnieuw' },
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
    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-5',
      max_tokens: 1024,
      system:     body.system || '',
      messages:   body.messages,
      tools:      body.tools || [],
    });

    return NextResponse.json(response);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Onbekende fout';
    console.error('[ai-chat]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
