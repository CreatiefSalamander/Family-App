/**
 * Notificatie triggers — stuurt push notificaties op basis van financiële events.
 * Roep deze aan vanuit server-side code (API routes, server actions).
 */

async function stuurPush(userId: string, title: string, body: string, url: string, tag: string) {
  try {
    await fetch('/api/push/send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, title, body, url, tag }),
    });
  } catch { /* stil negeren */ }
}

/** Budget waarschuwing: categorie > drempel% */
export async function triggerBudgetWaarschuwing(
  userId:    string,
  categorie: string,
  gebruikt:  number,
  limiet:    number,
  drempel:   number = 80
) {
  const pct = limiet > 0 ? Math.round((gebruikt / limiet) * 100) : 0;
  if (pct < drempel) return;

  const label = pct >= 100 ? 'Budget overschreden' : `Budget bijna vol (${pct}%)`;
  await stuurPush(
    userId,
    `⚠️ ${label}`,
    `${categorie}: €${gebruikt.toFixed(2)} van €${limiet.toFixed(2)} besteed`,
    '/begroting',
    `budget-${categorie}`
  );
}

/** Grote transactie melding */
export async function triggerGroteTransactie(
  userId:      string,
  bedrag:      number,
  omschrijving: string,
  drempel:     number = 100
) {
  if (bedrag < drempel) return;

  await stuurPush(
    userId,
    '💳 Grote transactie',
    `€${bedrag.toFixed(2)} — ${omschrijving}`,
    '/transacties',
    'grote-transactie'
  );
}

/** Schuld aflossing nadert (X dagen van tevoren) */
export async function triggerSchuldHerinnering(
  userId:      string,
  schuldeiser: string,
  bedrag:      number,
  dagenVoor:   number = 3
) {
  await stuurPush(
    userId,
    `📅 Herinnering: aflossing over ${dagenVoor} dagen`,
    `€${bedrag.toFixed(2)} voor ${schuldeiser}`,
    '/schulden',
    `schuld-${schuldeiser}`
  );
}

/** Doel bereikt */
export async function triggerDoelBereikt(userId: string, doelNaam: string) {
  await stuurPush(
    userId,
    '🎯 Doel bereikt!',
    `Gefeliciteerd! "${doelNaam}" is volledig gespaard.`,
    '/doelen',
    `doel-${doelNaam}`
  );
}

/** Laag saldo waarschuwing */
export async function triggerLaagSaldo(
  userId:   string,
  rekening: string,
  saldo:    number,
  drempel:  number = 500
) {
  if (saldo >= drempel) return;
  await stuurPush(
    userId,
    '⚡ Laag saldo',
    `${rekening}: €${saldo.toFixed(2)} — minder dan €${drempel}`,
    '/rekeningen',
    `laag-saldo-${rekening}`
  );
}
