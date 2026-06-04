-- ════════════════════════════════════════════════════════
-- Family-App — Supabase database setup
-- Uitvoeren in: Supabase SQL Editor
-- Project: lttxjfrtfrjnlazmbcyq.supabase.co
-- ════════════════════════════════════════════════════════

-- ── Schulden tabel ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS schulden (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  schuldeiser   text NOT NULL,
  type          text DEFAULT 'Persoonlijk',
  oorspronkelijk numeric NOT NULL,
  afgelost      numeric DEFAULT 0,
  maandtermijn  numeric DEFAULT 0,
  regeling      text,
  start_datum   date,
  einde_datum   date,
  status        text DEFAULT 'Actief',
  notitie       text,
  kleur         text DEFAULT '#EF4444'
);

-- ── Categorie regels tabel ──────────────────────────────
CREATE TABLE IF NOT EXISTS categorie_regels (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  zoekwoord   text NOT NULL,
  categorie   text NOT NULL,
  type        text DEFAULT 'Privé',
  soort       text DEFAULT 'Uitgave',
  icoon       text,
  kleur       text
);

-- ── Opdrachtgevers (zakelijk) ───────────────────────────
CREATE TABLE IF NOT EXISTS opdrachtgevers (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     timestamptz DEFAULT now(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  naam           text NOT NULL,
  bedrag_ex_btw  numeric DEFAULT 0,
  btw_percentage numeric DEFAULT 21,
  status         text DEFAULT 'Actief',
  notitie        text
);

-- ── Zakelijke kosten ────────────────────────────────────
CREATE TABLE IF NOT EXISTS zakelijke_kosten (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  naam        text NOT NULL,
  bedrag      numeric DEFAULT 0,
  type        text DEFAULT 'Vast',
  notitie     text
);

-- ── Document uploads ────────────────────────────────────
CREATE TABLE IF NOT EXISTS documenten (
  id                       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at               timestamptz DEFAULT now(),
  user_id                  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  naam                     text NOT NULL,
  type                     text NOT NULL,
  grootte                  numeric,
  url                      text,
  inhoud                   text,
  verwerkt                 boolean DEFAULT false,
  transacties_geimporteerd integer DEFAULT 0
);

-- ── RLS aanzetten ───────────────────────────────────────
ALTER TABLE schulden          ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorie_regels  ENABLE ROW LEVEL SECURITY;
ALTER TABLE opdrachtgevers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE zakelijke_kosten  ENABLE ROW LEVEL SECURITY;
ALTER TABLE documenten        ENABLE ROW LEVEL SECURITY;

-- ── Policies: elke gebruiker ziet alleen zijn eigen data ─
DROP POLICY IF EXISTS "eigen_data" ON schulden;
DROP POLICY IF EXISTS "eigen_data" ON categorie_regels;
DROP POLICY IF EXISTS "eigen_data" ON opdrachtgevers;
DROP POLICY IF EXISTS "eigen_data" ON zakelijke_kosten;
DROP POLICY IF EXISTS "eigen_data" ON documenten;

CREATE POLICY "eigen_data" ON schulden
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "eigen_data" ON categorie_regels
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "eigen_data" ON opdrachtgevers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "eigen_data" ON zakelijke_kosten
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "eigen_data" ON documenten
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Indexen voor performance ────────────────────────────
CREATE INDEX IF NOT EXISTS schulden_user_id_idx         ON schulden(user_id);
CREATE INDEX IF NOT EXISTS categorie_regels_user_id_idx ON categorie_regels(user_id);
CREATE INDEX IF NOT EXISTS opdrachtgevers_user_id_idx   ON opdrachtgevers(user_id);
CREATE INDEX IF NOT EXISTS zakelijke_kosten_user_id_idx ON zakelijke_kosten(user_id);
CREATE INDEX IF NOT EXISTS documenten_user_id_idx       ON documenten(user_id);

-- ────────────────────────────────────────────────────────
-- Klaar! Maak daarna in Supabase Dashboard → Storage:
-- New bucket: "documenten", Public: false
-- ────────────────────────────────────────────────────────
