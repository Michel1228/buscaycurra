-- ═══════════════════════════════════════════════════════════════════════════
-- Migración 004: Tablas de suscripciones, referidos, envíos de CV y blacklist
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar en: https://supabase.com/dashboard/project/ojesordjedovnpyxspxi/sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Columnas de referidos en profiles ───────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code    VARCHAR(12)  UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_count   INTEGER      NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_credits INTEGER      NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by      UUID         REFERENCES profiles(id) ON DELETE SET NULL;

-- Columna plan con constraint para evitar valores inválidos
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'esencial', 'basico', 'pro', 'empresa'));

-- Índices para búsquedas frecuentes en profiles
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code      ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_plan               ON profiles(plan);

-- ─── Tabla de referidos ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  UUID      NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id  UUID      NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code_used    VARCHAR(12),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referrals_referred_unique UNIQUE (referred_id) -- cada usuario solo puede ser referido una vez
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);

-- ─── Tabla de envíos de CV ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cv_sends (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name  TEXT,
  company_email TEXT,
  job_title     TEXT,
  company_url   TEXT,
  status        TEXT        NOT NULL DEFAULT 'pendiente'
                            CHECK (status IN ('pendiente', 'enviado', 'fallido', 'cancelado')),
  scheduled_for TIMESTAMPTZ,
  sent_at       TIMESTAMPTZ,
  priority      TEXT        NOT NULL DEFAULT 'normal'
                            CHECK (priority IN ('normal', 'prioritario')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cv_sends_user_id    ON cv_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_sends_status     ON cv_sends(status);
CREATE INDEX IF NOT EXISTS idx_cv_sends_created_at ON cv_sends(created_at);

-- ─── Tabla de blacklist de empresas ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cv_blacklist (
  company_email  TEXT        PRIMARY KEY,
  reason         TEXT,
  added_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RLS: cada usuario solo ve sus propios envíos ─────────────────────────────
ALTER TABLE cv_sends   ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cv_sends_own" ON cv_sends;
CREATE POLICY "cv_sends_own" ON cv_sends
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "referrals_own" ON referrals;
CREATE POLICY "referrals_own" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
