/**
 * Financiële gezondheidscore — 0 tot 100
 *
 * Gewichten:
 *   Budget naleving   30 punten
 *   Schulden voortgang 25 punten
 *   Spaar percentage   25 punten
 *   Netto positief     10 punten
 *   Doel voortgang     10 punten
 */

export interface GezondheidsData {
  budgetNaleving:    number;   // 0-1: fractie categorieën binnen budget
  schuldenVoortgang: number;   // 0-1: fractie schulden met voortgang
  spaarPercentage:   number;   // 0-1: fractie van inkomsten gespaard (bijv 0.15 = 15%)
  nettoPositief:     boolean;  // netto-inkomsten positief deze maand
  doelVoortgang:     number;   // 0-1: fractie doelen met recente bijdrage
}

export interface GezondheidsResultaat {
  score:         number;    // 0-100
  kleur:         string;    // hex kleur
  label:         string;    // tekst label
  emoji:         string;    // visueel
  breakdown: {
    budget:   number;
    schulden: number;
    sparen:   number;
    netto:    number;
    doelen:   number;
  };
}

export function berekenGezondheidscore(data: GezondheidsData): GezondheidsResultaat {
  const budget   = Math.round(Math.min(1, data.budgetNaleving)   * 30);
  const schulden = Math.round(Math.min(1, data.schuldenVoortgang) * 25);
  // Spaar score: >20% = vol, lineair
  const sparen   = Math.round(Math.min(1, data.spaarPercentage / 0.20) * 25);
  const netto    = data.nettoPositief ? 10 : 0;
  const doelen   = Math.round(Math.min(1, data.doelVoortgang) * 10);

  const score = Math.max(0, Math.min(100, budget + schulden + sparen + netto + doelen));

  let kleur: string;
  let label: string;
  let emoji: string;

  if (score >= 86)      { kleur = '#0179FE'; label = 'Uitstekend!';     emoji = '🏆'; }
  else if (score >= 71) { kleur = '#22C55E'; label = 'Goed bezig';      emoji = '✅'; }
  else if (score >= 41) { kleur = '#F59E0B'; label = 'Kan beter';       emoji = '⚡'; }
  else                  { kleur = '#EF4444'; label = 'Aandacht nodig';  emoji = '⚠️'; }

  return { score, kleur, label, emoji, breakdown: { budget, schulden, sparen, netto, doelen } };
}

/** Helper: bereken score vanuit ruwe transactie/budget/schuld data */
export function berekenScoreVanData(params: {
  budgetten:   { monthly_limit: number; werkelijk: number }[];
  schulden:    { oorspronkelijk: number; afgelost: number }[];
  doelen:      { target_amount: number; current_amount: number }[];
  inkomsten:   number;
  uitgaven:    number;
}): GezondheidsResultaat {
  const { budgetten, schulden, doelen, inkomsten, uitgaven } = params;

  const budgetNaleving = budgetten.length > 0
    ? budgetten.filter(b => b.werkelijk <= b.monthly_limit).length / budgetten.length
    : 0.5;

  const schuldenVoortgang = schulden.length > 0
    ? schulden.filter(s => s.afgelost > 0).length / schulden.length
    : 0;

  const spaarPercentage = inkomsten > 0
    ? Math.max(0, (inkomsten - uitgaven) / inkomsten)
    : 0;

  const nettoPositief = inkomsten > uitgaven;

  const doelVoortgang = doelen.length > 0
    ? doelen.filter(d => d.current_amount > 0).length / doelen.length
    : 0;

  return berekenGezondheidscore({
    budgetNaleving,
    schuldenVoortgang,
    spaarPercentage,
    nettoPositief,
    doelVoortgang,
  });
}
