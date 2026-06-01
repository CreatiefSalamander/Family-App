export const CLAUDE_MODEL = 'claude-sonnet-4-5';

export const AI_TOOLS = [
  {
    name: 'get_transactions',
    description: 'Haal transacties op voor analyse',
    input_schema: {
      type: 'object',
      properties: {
        month: { type: 'number' }, year: { type: 'number' },
        category: { type: 'string' }, limit: { type: 'number' },
      },
    },
  },
  {
    name: 'add_transaction',
    description: 'Voeg een transactie toe',
    input_schema: {
      type: 'object',
      properties: {
        amount: { type: 'number' }, description: { type: 'string' },
        category: { type: 'string' }, date: { type: 'string' },
        is_zakelijk: { type: 'boolean' },
      },
      required: ['amount', 'description', 'category'],
    },
  },
  {
    name: 'get_budget_status',
    description: 'Budget status per categorie',
    input_schema: { type: 'object', properties: { month: { type: 'number' }, year: { type: 'number' } } },
  },
  {
    name: 'get_summary',
    description: 'Financieel maandoverzicht',
    input_schema: { type: 'object', properties: { month: { type: 'number' }, year: { type: 'number' } } },
  },
];

export async function callClaude(
  apiKey: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: unknown }>,
  tools = AI_TOOLS
) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      tools,
    }),
  });
  return res.json();
}
