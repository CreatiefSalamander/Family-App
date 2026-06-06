/**
 * Eenvoudige in-memory sliding window rate limiter per gebruiker.
 * Werkt per serverless instantie — goed genoeg voor basisbeveiliging.
 */

// Map: sleutel:userId → lijst van timestamps (ms) binnen het huidige venster
const vensters = new Map<string, number[]>();

/**
 * Controleer of een gebruiker binnen de limiet zit.
 * @param userId    Supabase user ID
 * @param sleutel   Unieke naam voor de route (bijv. 'ai-chat')
 * @param max       Max verzoeken per venster
 * @param vensterMs Venstergrootte in milliseconden (standaard 60 seconden)
 * @returns { allowed: boolean, resetIn: ms tot vrijgave }
 */
export function checkRateLimit(
  userId: string,
  sleutel: string,
  max: number,
  vensterMs = 60_000,
): { allowed: boolean; resetIn: number } {
  const key = `${sleutel}:${userId}`;
  const nu  = Date.now();

  // Haal bestaande timestamps op, filter alles buiten het venster weg
  const tijden = (vensters.get(key) ?? []).filter(t => nu - t < vensterMs);

  if (tijden.length >= max) {
    // resetIn = tijd tot het oudste verzoek buiten het venster valt
    const resetIn = vensterMs - (nu - tijden[0]);
    return { allowed: false, resetIn };
  }

  tijden.push(nu);
  vensters.set(key, tijden);
  return { allowed: true, resetIn: 0 };
}
