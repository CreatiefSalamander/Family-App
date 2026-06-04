import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* Supabase tool uitvoering (vereenvoudigd voor Telegram) */
async function runTelegramTool(
  name: string,
  input: Record<string, unknown>,
  userId: string
): Promise<unknown> {
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const now = new Date();

  if (name === 'get_transactions') {
    const { data } = await sb.from('transactions').select('*').eq('user_id', userId)
      .order('date', { ascending: false }).limit(Number(input.limit) || 20);
    return { transactions: data, count: data?.length };
  }
  if (name === 'add_transaction') {
    const amount = Number(input.amount);
    const { data } = await sb.from('transactions').insert({
      user_id: userId, amount: Math.abs(amount),
      type: amount > 0 ? 'income' : 'expense',
      description: input.description as string,
      category: input.category as string,
      date: (input.date as string) || now.toISOString().split('T')[0],
      source: 'Telegram', status: 'OK', is_zakelijk: false,
      type_soort: amount > 0 ? 'Inkomst' : 'Uitgave',
    }).select().single();
    return { success: true, transaction: data };
  }
  if (name === 'get_budget_status') {
    const m = now.getMonth(); const y = now.getFullYear();
    const [{ data: txD }, { data: bD }] = await Promise.all([
      sb.from('transactions').select('*').eq('user_id', userId),
      sb.from('budgets').select('*').eq('user_id', userId),
    ]);
    const mTx = (txD || []).filter((t: Record<string, unknown>) => {
      const d = new Date(t.date as string);
      return d.getMonth() === m && d.getFullYear() === y && t.type === 'expense';
    });
    return (bD || []).map((b: Record<string, unknown>) => {
      const sp = mTx.filter((t: Record<string, unknown>) => t.category === b.category)
        .reduce((s: number, t: Record<string, unknown>) => s + (t.amount as number), 0);
      const pct = b.monthly_limit ? Math.round((sp / (b.monthly_limit as number)) * 100) : 0;
      return { categorie: b.category, budget: b.monthly_limit, besteed: sp, resterend: (b.monthly_limit as number) - sp, procent: pct };
    });
  }
  if (name === 'get_summary') {
    const { data: txD } = await sb.from('transactions').select('*').eq('user_id', userId);
    const m = now.getMonth(); const y = now.getFullYear();
    const mTx = (txD || []).filter((t: Record<string, unknown>) => {
      const d = new Date(t.date as string);
      return d.getMonth() === m && d.getFullYear() === y;
    });
    const inc = mTx.filter((t: Record<string, unknown>) => t.type === 'income').reduce((s: number, t: Record<string, unknown>) => s + (t.amount as number), 0);
    const exp = mTx.filter((t: Record<string, unknown>) => t.type === 'expense').reduce((s: number, t: Record<string, unknown>) => s + (t.amount as number), 0);
    return { inkomsten: inc.toFixed(2), uitgaven: exp.toFixed(2), netto: (inc - exp).toFixed(2), maand: now.toLocaleString('nl-NL', { month: 'long', year: 'numeric' }) };
  }
  return { error: 'Onbekende tool' };
}

async function verwerkTelegramBericht(tekst: string, userId: string): Promise<string> {
  const TOOLS = [
    { name: 'get_transactions', description: 'Haal transacties op', input_schema: { type: 'object', properties: { limit: { type: 'number' } } } },
    { name: 'add_transaction', description: 'Voeg transactie toe', input_schema: { type: 'object', properties: { amount: { type: 'number' }, description: { type: 'string' }, category: { type: 'string' }, date: { type: 'string' } }, required: ['amount', 'description', 'category'] } },
    { name: 'get_budget_status', description: 'Budget status', input_schema: { type: 'object', properties: {} } },
    { name: 'get_summary', description: 'Maandoverzicht', input_schema: { type: 'object', properties: {} } },
  ];

  const system = `Je bent Family AI, de financiële assistent van de Household app.
Antwoord in het Nederlands, kort en direct (max 3 zinnen).
Gebruik de tools om data uit de database te halen of toe te voegen.
Als bedragen worden gevraagd, geef altijd het totaal en een snelle tip.`;

  let msgs: Anthropic.Messages.MessageParam[] = [{ role: 'user', content: tekst }];
  let resp = await anthropic.messages.create({ model: 'claude-sonnet-4-5', max_tokens: 512, system, messages: msgs, tools: TOOLS as Anthropic.Messages.Tool[] });

  while (resp.stop_reason === 'tool_use') {
    const tu = resp.content.find(c => c.type === 'tool_use') as Anthropic.Messages.ToolUseBlock;
    if (!tu) break;
    const result = await runTelegramTool(tu.name, tu.input as Record<string, unknown>, userId);
    msgs = [
      ...msgs,
      { role: 'assistant', content: resp.content },
      { role: 'user',      content: [{ type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify(result) }] },
    ];
    resp = await anthropic.messages.create({ model: 'claude-sonnet-4-5', max_tokens: 512, system, messages: msgs, tools: TOOLS as Anthropic.Messages.Tool[] });
  }

  const tekstBlock = resp.content.find(c => c.type === 'text') as Anthropic.Messages.TextBlock | undefined;
  return tekstBlock?.text || 'Kon je vraag niet verwerken.';
}

async function stuurTelegram(chatId: string, tekst: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ chat_id: chatId, text: tekst, parse_mode: 'Markdown' }),
  });
}

export async function POST(req: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const allowedChatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken) return NextResponse.json({ ok: true });

  try {
    const body = await req.json();
    const message = body.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId  = String(message.chat.id);
    const tekst   = message.text || '';

    /* Beveiligingscheck — alleen eigen chat ID */
    if (allowedChatId && chatId !== allowedChatId) {
      await stuurTelegram(chatId, '❌ Ongeautoriseerde toegang.');
      return NextResponse.json({ ok: true });
    }

    /* /start commando */
    if (tekst === '/start') {
      await stuurTelegram(chatId, `👋 Welkom bij *Household AI*!\n\nJe kunt me vragen stellen over je financiën:\n• "Hoeveel heb ik deze maand uitgegeven?"\n• "Voeg €45 boodschappen toe"\n• "Hoe staat mijn budget?"\n• "Wat is mijn saldo?"\n\nJe chat ID is: \`${chatId}\``);
      return NextResponse.json({ ok: true });
    }

    /* Haal user ID op uit notificatie_instellingen */
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: notifRow } = await sb
      .from('notificatie_instellingen')
      .select('user_id')
      .eq('telegram_chat_id', chatId)
      .single();

    if (!notifRow) {
      await stuurTelegram(chatId, '⚙️ Koppel eerst je Telegram account via de Household app → Instellingen → Telegram Bot.');
      return NextResponse.json({ ok: true });
    }

    await stuurTelegram(chatId, '⏳ Bezig...');
    const antwoord = await verwerkTelegramBericht(tekst, notifRow.user_id);
    await stuurTelegram(chatId, antwoord);

  } catch (err) {
    console.error('[telegram webhook]', err);
  }

  return NextResponse.json({ ok: true });
}
