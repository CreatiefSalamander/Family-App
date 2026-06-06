/**
 * Rate limiter — Upstash Redis als env vars aanwezig zijn, anders in-memory fallback.
 *
 * Upstash gratis tier: 10.000 commands/dag, persistent over serverless instanties.
 * Voeg toe aan Netlify env vars:
 *   UPSTASH_REDIS_REST_URL   → https://xxxxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN → AXxx...
 *
 * Bestaande aanroepen hoeven NIET gewijzigd te worden — dezelfde interface.
 */

// ── In-memory fallback (per instantie) ───────────────────────────────────────
const vensters = new Map<string, number[]>();

function inMemoryCheck(
  key: string,
  max: number,
  vensterMs: number,
): { allowed: boolean; resetIn: number } {
  const nu    = Date.now();
  const tijden = (vensters.get(key) ?? []).filter(t => nu - t < vensterMs);

  if (tijden.length >= max) {
    return { allowed: false, resetIn: vensterMs - (nu - tijden[0]) };
  }
  tijden.push(nu);
  vensters.set(key, tijden);
  return { allowed: true, resetIn: 0 };
}

// ── Upstash sliding window via REST API (geen import nodig) ──────────────────
async function upstashCheck(
  key: string,
  max: number,
  vensterSec: number,
): Promise<{ allowed: boolean; resetIn: number }> {
  const url   = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const nu    = Date.now();
  const windowStart = nu - vensterSec * 1000;

  // MULTI: verwijder oude entries, tel, voeg toe, stel TTL in
  const cmds = [
    ['ZREMRANGEBYSCORE', key, '0', String(windowStart)],
    ['ZCARD', key],
    ['ZADD', key, String(nu), String(nu)],
    ['EXPIRE', key, String(vensterSec)],
  ];

  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cmds),
  });

  if (!res.ok) {
    // Upstash niet bereikbaar — veilig terugvallen op in-memory
    return inMemoryCheck(key, max, vensterSec * 1000);
  }

  const data = await res.json() as Array<{ result: unknown }>;
  // data[1].result = ZCARD vóór onze nieuwe entry = aantal verzoeken in venster
  const huidigeCount = Number(data[1].result ?? 0);

  if (huidigeCount >= max) {
    // Bereken wanneer het oudste entry verloopt
    const oldestRes = await fetch(`${url}/ZRANGE/${encodeURIComponent(key)}/0/0/WITHSCORES`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    let resetIn = vensterSec * 1000;
    if (oldestRes.ok) {
      const od = await oldestRes.json() as { result: string[] };
      const oldest = Number(od.result?.[1] ?? nu - vensterSec * 1000);
      resetIn = Math.max(0, oldest + vensterSec * 1000 - nu);
    }
    // Verwijder de net toegevoegde entry (we weigeren het verzoek)
    await fetch(`${url}/ZREM/${encodeURIComponent(key)}/${nu}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { allowed: false, resetIn };
  }

  return { allowed: true, resetIn: 0 };
}

// ── Publieke interface — drop-in vervanging ──────────────────────────────────
/**
 * Controleer of een gebruiker binnen de limiet zit.
 * @param userId    Supabase user ID (of IP als fallback)
 * @param sleutel   Unieke naam voor de route (bijv. 'ai-chat')
 * @param max       Max verzoeken per venster
 * @param vensterMs Venstergrootte in milliseconden (standaard 60 seconden)
 */
export async function checkRateLimit(
  userId: string,
  sleutel: string,
  max: number,
  vensterMs = 60_000,
): Promise<{ allowed: boolean; resetIn: number }> {
  const key        = `rl:${sleutel}:${userId}`;
  const vensterSec = Math.ceil(vensterMs / 1000);

  const heeftUpstash =
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN;

  if (heeftUpstash) {
    return upstashCheck(key, max, vensterSec);
  }
  return inMemoryCheck(key, max, vensterMs);
}
