/**
 * Eenvoudige in-memory sliding window rate limiter per gebruiker.
 * Werkt per serverless instantie — goed genoeg voor basisbeveiliging.
 */

// Map: userId → lijst van timestamps (ms) binnen het huidige venster
const vensters = new Map<string, number[]>();

/**
 * Controleer of een gebruiker binnen de limiet zit.
 * @param userId    Supabase user ID
 * @param sleutel   Unieke naam voor de route (bijv. 'ai-chat')
 * @param max       Max verzoeken per venster
 * @param vensterMs Venstergrootte in milliseconden (standaard 60 seconden)
 * @returns true als het verzoek toegestaan is, false als de limiet bereikt is
 */
export function checkRateLimit(
  userId: string,
  sleutel: string,
  max: number,
  vensterMs = 60_000,
): boolean {
  const key = `${sleutel}:${userId}`;
  const nu  = Date.now();

  // Haal bestaande timestamps op, filter alles buiten het venster weg
  const tijden = (vensters.get(key) ?? []).filter(t => nu - t < vensterMs);

  if (tijden.length >= max) return false;

  tijden.push(nu);
  vensters.set(key, tijden);
  return true;
}
