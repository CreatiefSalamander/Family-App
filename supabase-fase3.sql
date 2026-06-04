-- ════════════════════════════════════════════════════════
-- Household App — Fase 3 database tabellen
-- Uitvoeren in Supabase SQL Editor
-- ════════════════════════════════════════════════════════

-- ── Push tokens ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_tokens (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token       text NOT NULL,
  platform    text DEFAULT 'web',
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);

-- ── Gezin koppelingen ────────────────────────────────────
CREATE TABLE IF NOT EXISTS gezin_koppelingen (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  eigenaar_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  gedeeld_budget    boolean DEFAULT true,
  gedeelde_doelen   boolean DEFAULT true,
  gedeelde_schulden boolean DEFAULT false,
  status            text DEFAULT 'Uitnodiging verstuurd',
  created_at        timestamptz DEFAULT now()
);

-- ── Notificatie instellingen uitbreiden ───────────────────
CREATE TABLE IF NOT EXISTS notificatie_instellingen (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  budget_waarschuwing   boolean DEFAULT true,
  budget_drempel        integer DEFAULT 80,
  betaling_herinnering  boolean DEFAULT true,
  betaling_dagen        integer DEFAULT 3,
  dagelijkse_briefing   boolean DEFAULT false,
  briefing_tijd         text DEFAULT '08:00',
  telegram_chat_id      text,
  telegram_actief       boolean DEFAULT false,
  stille_uren_start     text DEFAULT '22:00',
  stille_uren_eind      text DEFAULT '07:00',
  saldo_drempel         numeric DEFAULT 500,
  transactie_drempel    numeric DEFAULT 100
);

-- ── RLS ──────────────────────────────────────────────────
ALTER TABLE push_tokens        ENABLE ROW LEVEL SECURITY;
ALTER TABLE gezin_koppelingen  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificatie_instellingen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "eigen_data" ON push_tokens;
DROP POLICY IF EXISTS "eigen_data" ON gezin_koppelingen;
DROP POLICY IF EXISTS "eigen_data" ON notificatie_instellingen;

CREATE POLICY "eigen_data" ON push_tokens
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "eigen_data" ON gezin_koppelingen
  FOR ALL USING (auth.uid() = eigenaar_id OR auth.uid() = partner_id);

CREATE POLICY "eigen_data" ON notificatie_instellingen
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Indexen ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS push_tokens_user_idx     ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS gezin_eigenaar_idx       ON gezin_koppelingen(eigenaar_id);
CREATE INDEX IF NOT EXISTS gezin_partner_idx        ON gezin_koppelingen(partner_id);
CREATE INDEX IF NOT EXISTS notif_instellingen_idx   ON notificatie_instellingen(user_id);
