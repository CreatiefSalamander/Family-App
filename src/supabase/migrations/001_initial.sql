-- Family-App schema uitbreidingen
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS account_id uuid,
  ADD COLUMN IF NOT EXISTS type_soort text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'Handmatig',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'OK',
  ADD COLUMN IF NOT EXISTS tegenpartij text,
  ADD COLUMN IF NOT EXISTS saldo_na numeric,
  ADD COLUMN IF NOT EXISTS is_zakelijk boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS merchant_logo text;

CREATE TABLE IF NOT EXISTS schulden (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  schuldeiser text NOT NULL,
  type text,
  oorspronkelijk numeric NOT NULL,
  afgelost numeric DEFAULT 0,
  maandtermijn numeric DEFAULT 0,
  regeling text,
  start_datum date,
  einde_datum date,
  status text DEFAULT 'Open',
  notitie text,
  kleur text DEFAULT '#EF4444'
);

CREATE TABLE IF NOT EXISTS categorie_regels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  zoekwoord text NOT NULL,
  categorie text NOT NULL,
  type text DEFAULT 'Privé',
  soort text DEFAULT 'Uitgave',
  icoon text,
  kleur text
);

CREATE TABLE IF NOT EXISTS eigen_ibans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  iban text NOT NULL,
  bank_naam text,
  rekening_naam text
);

CREATE TABLE IF NOT EXISTS profielen (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  voornaam text,
  achternaam text,
  ai_persoonlijkheid text DEFAULT 'vriend',
  locatie_toestemming boolean DEFAULT false,
  dark_mode boolean DEFAULT false,
  taal text DEFAULT 'nl',
  onboarding_voltooid boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prijstrackers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  product_naam text NOT NULL,
  huidige_prijs numeric,
  doel_prijs numeric,
  winkel text,
  url text,
  actief boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS ai_gesprekken (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  rol text NOT NULL,
  bericht text NOT NULL,
  pagina text
);

-- RLS
ALTER TABLE schulden ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorie_regels ENABLE ROW LEVEL SECURITY;
ALTER TABLE eigen_ibans ENABLE ROW LEVEL SECURITY;
ALTER TABLE profielen ENABLE ROW LEVEL SECURITY;
ALTER TABLE prijstrackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_gesprekken ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "eigen data" ON schulden FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "eigen data" ON categorie_regels FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "eigen data" ON eigen_ibans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "eigen data" ON profielen FOR ALL USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "eigen data" ON prijstrackers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "eigen data" ON ai_gesprekken FOR ALL USING (auth.uid() = user_id);
