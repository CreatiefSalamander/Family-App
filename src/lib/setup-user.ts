/**
 * setup-user.ts
 *
 * Wordt aangeroepen bij eerste login van een nieuwe gebruiker.
 * Vult standaard categorie-regels, schulden en zakelijke data
 * die alleen zichtbaar zijn na login in het eigen account.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/* ── Categorie regels ──────────────────────────────────── */
export async function setupCategorieRegels(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: bestaand } = await supabase
    .from('categorie_regels')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (bestaand && bestaand.length > 0) return; // al ingesteld

  const regels = [
    // Boodschappen
    { zoekwoord:'albert heijn', categorie:'Boodschappen', soort:'Uitgave', icoon:'ShoppingCart', kleur:'#22C55E' },
    { zoekwoord:'jumbo',        categorie:'Boodschappen', soort:'Uitgave', icoon:'ShoppingCart', kleur:'#22C55E' },
    { zoekwoord:'lidl',         categorie:'Boodschappen', soort:'Uitgave', icoon:'ShoppingCart', kleur:'#22C55E' },
    { zoekwoord:'aldi',         categorie:'Boodschappen', soort:'Uitgave', icoon:'ShoppingCart', kleur:'#22C55E' },
    { zoekwoord:'plus supermarkt', categorie:'Boodschappen', soort:'Uitgave', icoon:'ShoppingCart', kleur:'#22C55E' },
    // Transport
    { zoekwoord:'ns ',          categorie:'Transport', soort:'Uitgave', icoon:'Train', kleur:'#3B82F6' },
    { zoekwoord:'ov-chipkaart', categorie:'Transport', soort:'Uitgave', icoon:'Train', kleur:'#3B82F6' },
    { zoekwoord:'shell',        categorie:'Auto',      soort:'Uitgave', icoon:'Car',   kleur:'#6B7280' },
    { zoekwoord:'bp ',          categorie:'Auto',      soort:'Uitgave', icoon:'Car',   kleur:'#6B7280' },
    { zoekwoord:'esso',         categorie:'Auto',      soort:'Uitgave', icoon:'Car',   kleur:'#6B7280' },
    { zoekwoord:'tango',        categorie:'Auto',      soort:'Uitgave', icoon:'Car',   kleur:'#6B7280' },
    // Lifestyle
    { zoekwoord:'spotify',      categorie:'Lifestyle', soort:'Uitgave', icoon:'Music', kleur:'#A855F7' },
    { zoekwoord:'netflix',      categorie:'Lifestyle', soort:'Uitgave', icoon:'Tv',    kleur:'#A855F7' },
    { zoekwoord:'disney',       categorie:'Lifestyle', soort:'Uitgave', icoon:'Tv',    kleur:'#A855F7' },
    { zoekwoord:'prime video',  categorie:'Lifestyle', soort:'Uitgave', icoon:'Tv',    kleur:'#A855F7' },
    // Gezondheid
    { zoekwoord:'apotheek',     categorie:'Gezondheid', soort:'Uitgave', icoon:'Pill', kleur:'#10B981' },
    { zoekwoord:'etos',         categorie:'Gezondheid', soort:'Uitgave', icoon:'Pill', kleur:'#10B981' },
    { zoekwoord:'kruidvat',     categorie:'Gezondheid', soort:'Uitgave', icoon:'Pill', kleur:'#10B981' },
    // Zorgverzekering
    { zoekwoord:'zorgverzekering', categorie:'Zorgverzekering', soort:'Uitgave', icoon:'Heart', kleur:'#EF4444' },
    { zoekwoord:'cz ',          categorie:'Zorgverzekering', soort:'Uitgave', icoon:'Heart', kleur:'#EF4444' },
    { zoekwoord:'vgz',          categorie:'Zorgverzekering', soort:'Uitgave', icoon:'Heart', kleur:'#EF4444' },
    { zoekwoord:'menzis',       categorie:'Zorgverzekering', soort:'Uitgave', icoon:'Heart', kleur:'#EF4444' },
    // Telefoon & internet
    { zoekwoord:'vodafone',     categorie:'Telefoon', soort:'Uitgave', icoon:'Smartphone', kleur:'#06B6D4' },
    { zoekwoord:'t-mobile',     categorie:'Telefoon', soort:'Uitgave', icoon:'Smartphone', kleur:'#06B6D4' },
    { zoekwoord:'kpn',          categorie:'Telefoon', soort:'Uitgave', icoon:'Smartphone', kleur:'#06B6D4' },
    { zoekwoord:'ziggo',        categorie:'Telefoon', soort:'Uitgave', icoon:'Wifi',       kleur:'#06B6D4' },
    // Wonen
    { zoekwoord:'huur',         categorie:'Wonen', soort:'Uitgave', icoon:'Home', kleur:'#6366F1' },
    { zoekwoord:'hypotheek',    categorie:'Wonen', soort:'Uitgave', icoon:'Home', kleur:'#6366F1' },
    // Energie
    { zoekwoord:'eneco',        categorie:'Energie', soort:'Uitgave', icoon:'Zap', kleur:'#F59E0B' },
    { zoekwoord:'vattenfall',   categorie:'Energie', soort:'Uitgave', icoon:'Zap', kleur:'#F59E0B' },
    { zoekwoord:'essent',       categorie:'Energie', soort:'Uitgave', icoon:'Zap', kleur:'#F59E0B' },
    // Belasting
    { zoekwoord:'belastingdienst', categorie:'Belasting', soort:'Uitgave', icoon:'Landmark', kleur:'#1D4ED8' },
    // Schulden aflossing
    { zoekwoord:'duo ',         categorie:'Schulden', soort:'Aflossing', icoon:'CreditCard', kleur:'#F59E0B' },
    { zoekwoord:'avres',        categorie:'Schulden', soort:'Aflossing', icoon:'CreditCard', kleur:'#EF4444' },
    // Inkomen
    { zoekwoord:'uwv',          categorie:'Inkomen', soort:'Inkomst', icoon:'TrendingUp', kleur:'#22C55E' },
    { zoekwoord:'salaris',      categorie:'Inkomen', soort:'Inkomst', icoon:'TrendingUp', kleur:'#22C55E' },
    // Online shopping
    { zoekwoord:'bol.com',      categorie:'Online shopping', soort:'Uitgave', icoon:'Package', kleur:'#F97316' },
    { zoekwoord:'amazon',       categorie:'Online shopping', soort:'Uitgave', icoon:'Package', kleur:'#F97316' },
    // Kleding
    { zoekwoord:'zara',         categorie:'Kleding', soort:'Uitgave', icoon:'Shirt', kleur:'#EC4899' },
    { zoekwoord:'h&m',          categorie:'Kleding', soort:'Uitgave', icoon:'Shirt', kleur:'#EC4899' },
  ];

  await supabase.from('categorie_regels').insert(
    regels.map(r => ({ ...r, user_id: userId, type: 'Privé' }))
  );
}

/* ── Schulden (privé) ──────────────────────────────────── */
export async function setupSchulden(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: bestaand } = await supabase
    .from('schulden')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (bestaand && bestaand.length > 0) return;

  const schulden = [
    {
      schuldeiser: 'Avres',
      type: 'Schuldsanering',
      oorspronkelijk: 26200,
      afgelost: 0,
      maandtermijn: 200,
      status: 'Actief',
      kleur: '#EF4444',
      notitie: 'Betalingsregeling actief',
    },
    {
      schuldeiser: 'DUO',
      type: 'Studieschuld',
      oorspronkelijk: 13500,
      afgelost: 0,
      maandtermijn: 150,
      status: 'Actief',
      kleur: '#F59E0B',
      notitie: '',
    },
    {
      schuldeiser: 'Advocaat',
      type: 'Juridisch',
      oorspronkelijk: 5758,
      afgelost: 0,
      maandtermijn: 100,
      status: 'Actief',
      kleur: '#6172F3',
      notitie: '',
    },
    {
      schuldeiser: 'Belastingdienst',
      type: 'Belastingschuld',
      oorspronkelijk: 4925,
      afgelost: 0,
      maandtermijn: 91,
      status: 'Actief',
      kleur: '#1D4ED8',
      notitie: 'Betalingsregeling actief',
    },
    {
      schuldeiser: 'ING Lening',
      type: 'Persoonlijke lening',
      oorspronkelijk: 3841,
      afgelost: 0,
      maandtermijn: 150,
      status: 'Actief',
      kleur: '#0179FE',
      notitie: '',
    },
  ];

  await supabase.from('schulden').insert(
    schulden.map(s => ({ ...s, user_id: userId }))
  );
}

/* ── Zakelijke data ────────────────────────────────────── */
export async function setupZakelijk(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: bestaandOp } = await supabase
    .from('opdrachtgevers')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (!bestaandOp || bestaandOp.length === 0) {
    await supabase.from('opdrachtgevers').insert([
      { user_id: userId, naam: 'Opdrachtgever 1', bedrag_ex_btw: 2500, btw_percentage: 21, status: 'Actief' },
      { user_id: userId, naam: 'Opdrachtgever 2', bedrag_ex_btw: 2000, btw_percentage: 21, status: 'Actief' },
      { user_id: userId, naam: 'Opdrachtgever 3', bedrag_ex_btw: 1500, btw_percentage: 21, status: 'Actief' },
    ]);
  }

  const { data: bestaandKosten } = await supabase
    .from('zakelijke_kosten')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (!bestaandKosten || bestaandKosten.length === 0) {
    await supabase.from('zakelijke_kosten').insert([
      { user_id: userId, naam: 'Lease auto',          bedrag: 850,  type: 'Vast' },
      { user_id: userId, naam: 'Boekhouder',          bedrag: 150,  type: 'Vast' },
      { user_id: userId, naam: 'Verzekeringen BV',    bedrag: 100,  type: 'Vast' },
      { user_id: userId, naam: 'Overige kosten',      bedrag: 100,  type: 'Variabel' },
    ]);
  }
}

/* ── Hoofd setup functie ───────────────────────────────── */
export async function setupNieuweGebruiker(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await Promise.all([
    setupCategorieRegels(supabase, userId),
    setupSchulden(supabase, userId),
    setupZakelijk(supabase, userId),
  ]);
}
