/**
 * Rate limiter — gebruikt Supabase als SUPABASE_SERVICE_ROLE_KEY aanwezig is,
 * anders in-memory fallback (per serverless instantie).
 *
 * Vereist eenmalig in Supabase SQL Editor:
 *   → zie CLAUDE.md of vraag aan Claude om de migratie SQL
 *
 * Env var nodig in Netlify:
 *   SUPABASE_SERVICE_ROLE_KEY  (Supabase dashboard → Settings → API → service_role)
 */

// ── In-memory fallback ────────────────────────────────────────────────────────
const vensters = new Map<string, number[]>();

function inMemoryCheck(
  key: string,
  max: number,
  vensterMs: number,
): { allowed: boolean; resetIn: number } {
  const nu     = Date.now();
  const tijden = (vensters.get(key) ?? []).filter(t => nu - t < vensterMs);

  if (tijden.length >= max) {
    return { allowed: false, resetIn: vensterMs - (nu - tijden[0]) };
  }
  tijden.push(nu);
  vensters.set(key, tijden);
  return { allowed: true, resetIn: 0 };
}

// ── Supabase RPC check (atomisch via stored function) ─────────────────────────
async function supabaseCheck(
  key: string,
  max: number,
  vensterSec: number,
): Promise<{ allowed: boolean; resetIn: number }> {
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  try {
    const res = await fetch(`${url}/rest/v1/rpc/check_rate_limit`, {
      method: 'POST',
      headers: {
        apikey:          serviceKey,
        Authorization:   `Bearer ${serviceKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        p_key:            key,
        p_max:            max,
        p_window_seconds: vensterSec,
      }),
    });

    if (!res.ok) {
      // Supabase niet bereikbaar — veilig terugvallen op in-memory
      console.warn('[rate-limit] Supabase RPC mislukt, gebruik in-memory fallback');
      return inMemoryCheck(key, max, vensterSec * 1000);
    }

    const data = await res.json() as { allowed: boolean; reset_in: number };
    return { allowed: data.allowed, resetIn: data.reset_in ?? 0 };

  } catch {
    return inMemoryCheck(key, max, vensterSec * 1000);
  }
}

// ── Publieke interface ────────────────────────────────────────────────────────
/**
 * Controleer of een gebruiker binnen de limiet zit.
 * @param userId    Supabase user ID
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

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return supabaseCheck(key, max, vensterSec);
  }

  // Geen service key → in-memory fallback
  return inMemoryCheck(key, max, vensterMs);
}
