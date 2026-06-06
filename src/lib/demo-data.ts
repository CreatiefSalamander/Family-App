/**
 * Demo data voor de Family App — willekeurige maar realistische NL data.
 * Wordt gebruikt in demo modus (geen Supabase account nodig).
 */

export const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@household.app',
  voornaam: 'Sara',
  achternaam: 'Visser',
  taal: 'nl',
};

export const DEMO_REKENINGEN = [
  {
    id: 'rek-1',
    user_id: 'demo-user-id',
    naam: 'ABN AMRO Betaalrekening',
    type: 'betaalrekening',
    saldo: 3842.50,
    iban: 'NL91ABNA0417164300',
    kleur: '#0179FE',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'rek-2',
    user_id: 'demo-user-id',
    naam: 'ING Spaarrekening',
    type: 'spaarrekening',
    saldo: 12450.00,
    iban: 'NL20INGB0001234567',
    kleur: '#F59E0B',
    created_at: '2024-01-01T00:00:00Z',
  },
];

const nu = new Date();
const mnd = (delta: number) => {
  const d = new Date(nu);
  d.setMonth(d.getMonth() + delta);
  return d.toISOString().split('T')[0];
};

export const DEMO_TRANSACTIES = [
  /* Inkomsten */
  { id: 'tx-1',  user_id: 'demo-user-id', date: mnd(0).slice(0,8) + '01', amount: 3200, type: 'income',  description: 'Salaris mei', category: 'Salaris', tegenpartij: 'Werkgever BV', source: 'demo', status: 'OK', is_zakelijk: false },
  { id: 'tx-2',  user_id: 'demo-user-id', date: mnd(-1).slice(0,8) + '01', amount: 3200, type: 'income',  description: 'Salaris april', category: 'Salaris', tegenpartij: 'Werkgever BV', source: 'demo', status: 'OK', is_zakelijk: false },
  { id: 'tx-3',  user_id: 'demo-user-id', date: mnd(0).slice(0,8) + '05', amount: 450, type: 'income',  description: 'Freelance opdracht', category: 'Zakelijk', tegenpartij: 'Klant X', source: 'demo', status: 'OK', is_zakelijk: true },
  /* Vaste lasten */
  { id: 'tx-4',  user_id: 'demo-user-id', date: mnd(0).slice(0,8) + '01', amount: 850, type: 'expense', description: 'Huur appartement', category: 'Wonen', tegenpartij: 'Verhuurder', source: 'demo', status: 'OK', is_zakelijk: false },
  { id: 'tx-5',  user_id: 'demo-user-id', date: mnd(0).slice(0,8) + '03', amount: 112, type: 'expense', description: 'Energierekening', category: 'Wonen', tegenpartij: 'Vattenfall', source: 'demo', status: 'OK', is_zakelijk: false },
  { id: 'tx-6',  user_id: 'demo-user-id', date: mnd(0).slice(0,8) + '03', amount: 42, type: 'expense', description: 'Netflix + Spotify', category: 'Abonnement', tegenpartij: 'Netflix', source: 'demo', status: 'OK', is_zakelijk: false },
  { id: 'tx-7',  user_id: 'demo-user-id', date: mnd(0).slice(0,8) + '05', amount: 185, type: 'expense', description: 'Zorgverzekering', category: 'Gezondheid', tegenpartij: 'Zilveren Kruis', source: 'demo', status: 'OK', is_zakelijk: false },
  /* Boodschappen */
  { id: 'tx-8',  user_id: 'demo-user-id', date: mnd(0).slice(0,8) + '06', amount: 68.40, type: 'expense', description: 'Albert Heijn', category: 'Boodschappen', tegenpartij: 'Albert Heijn', source: 'demo', status: 'OK', is_zakelijk: false },
  { id: 'tx-9',  user_id: 'demo-user-id', date: mnd(0).slice(0,8) + '09', amount: 52.15, type: 'expense', description: 'Jumbo weekboodschappen', category: 'Boodschappen', tegenpartij: 'Jumbo', source: 'demo', status: 'OK', is_zakelijk: false },
  { id: 'tx-10', user_id: 'demo-user-id', date: mnd(0).slice(0,8) + '11', amount: 44.90, type: 'expense', description: 'Lidl', category: 'Boodschappen', tegenpartij: 'Lidl', source: 'demo', status: 'OK', is_zakelijk: false },
  /* Eten & drinken */
  { id: 'tx-11', user_id: 'demo-user-id', date: mnd(0).slice(0,8) + '08', amount: 34.50, type: 'expense', description: 'Restaurant La Perla', category: 'Eten', tegenpartij: 'La Perla', source: 'demo', status: 'OK', is_zakelijk: false },
  { id: 'tx-12', user_id: 'demo-user-id', date: mnd(0).slice(0,8) + '10', amount: 18.90, type: 'expense', description: 'Dominos bestelling', category: 'Eten', tegenpartij: 'Dominos', source: 'demo', status: 'OK', is_zakelijk: false },
  /* Transport */
  { id: 'tx-13', user_id: 'demo-user-id', date: mnd(0).slice(0,8) + '07', amount: 82.00, type: 'expense', description: 'OV-kaart maandabonnement', category: 'Transport', tegenpartij: 'NS', source: 'demo', status: 'OK', is_zakelijk: false },
  { id: 'tx-14', user_id: 'demo-user-id', date: mnd(0).slice(0,8) + '12', amount: 55.20, type: 'expense', description: 'Benzine Shell', category: 'Transport', tegenpartij: 'Shell', source: 'demo', status: 'OK', is_zakelijk: false },
  /* Kleding & vrije tijd */
  { id: 'tx-15', user_id: 'demo-user-id', date: mnd(0).slice(0,8) + '14', amount: 89.95, type: 'expense', description: 'H&M winkelcentrum', category: 'Kleding', tegenpartij: 'H&M', source: 'demo', status: 'OK', is_zakelijk: false },
  { id: 'tx-16', user_id: 'demo-user-id', date: mnd(0).slice(0,8) + '15', amount: 25.00, type: 'expense', description: 'Sportschool abonnement', category: 'Sport', tegenpartij: 'Basic-Fit', source: 'demo', status: 'OK', is_zakelijk: false },
  /* Vorige maand */
  { id: 'tx-17', user_id: 'demo-user-id', date: mnd(-1).slice(0,8) + '05', amount: 750, type: 'expense', description: 'Huur april', category: 'Wonen', tegenpartij: 'Verhuurder', source: 'demo', status: 'OK', is_zakelijk: false },
  { id: 'tx-18', user_id: 'demo-user-id', date: mnd(-1).slice(0,8) + '12', amount: 145.60, type: 'expense', description: 'Boodschappen april', category: 'Boodschappen', tegenpartij: 'Albert Heijn', source: 'demo', status: 'OK', is_zakelijk: false },
  { id: 'tx-19', user_id: 'demo-user-id', date: mnd(-2).slice(0,8) + '01', amount: 3200, type: 'income', description: 'Salaris maart', category: 'Salaris', tegenpartij: 'Werkgever BV', source: 'demo', status: 'OK', is_zakelijk: false },
  { id: 'tx-20', user_id: 'demo-user-id', date: mnd(-2).slice(0,8) + '10', amount: 380, type: 'expense', description: 'Vakantie voorschot', category: 'Overig', tegenpartij: 'TUI', source: 'demo', status: 'OK', is_zakelijk: false },
];

export const DEMO_BUDGETS = [
  { id: 'bud-1', user_id: 'demo-user-id', category: 'Boodschappen',  monthly_limit: 300 },
  { id: 'bud-2', user_id: 'demo-user-id', category: 'Eten',           monthly_limit: 150 },
  { id: 'bud-3', user_id: 'demo-user-id', category: 'Transport',      monthly_limit: 150 },
  { id: 'bud-4', user_id: 'demo-user-id', category: 'Kleding',        monthly_limit: 100 },
  { id: 'bud-5', user_id: 'demo-user-id', category: 'Wonen',          monthly_limit: 1000 },
  { id: 'bud-6', user_id: 'demo-user-id', category: 'Abonnement',     monthly_limit: 60 },
];

export const DEMO_SCHULDEN = [
  {
    id: 'sch-1',
    user_id: 'demo-user-id',
    schuldeiser: 'ING Bank — Persoonlijke lening',
    oorspronkelijk: 8000,
    afgelost: 3200,
    maandlast: 180,
    rente: 4.9,
    einddatum: '2027-06-01',
    notities: '',
  },
  {
    id: 'sch-2',
    user_id: 'demo-user-id',
    schuldeiser: 'Creditcard Visa',
    oorspronkelijk: 1500,
    afgelost: 800,
    maandlast: 75,
    rente: 14.9,
    einddatum: '2025-12-01',
    notities: '',
  },
];

export const DEMO_DOELEN = [
  {
    id: 'doel-1',
    user_id: 'demo-user-id',
    name: 'Vakantie Griekenland',
    emoji: '🏖️',
    target_amount: 3000,
    current_amount: 1250,
    deadline: '2025-08-01',
    notities: '',
  },
  {
    id: 'doel-2',
    user_id: 'demo-user-id',
    name: 'Nieuwe laptop',
    emoji: '💻',
    target_amount: 1200,
    current_amount: 680,
    deadline: '2025-09-01',
    notities: '',
  },
  {
    id: 'doel-3',
    user_id: 'demo-user-id',
    name: 'Noodfonds 3 maanden',
    emoji: '🛡️',
    target_amount: 9000,
    current_amount: 4500,
    deadline: '2026-01-01',
    notities: '',
  },
];
