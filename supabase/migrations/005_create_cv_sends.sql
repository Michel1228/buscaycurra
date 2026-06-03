-- ═══════════════════════════════════════════════════════════════════════════
-- Migración 005: Crear tabla cv_sends y reparar sent_at nulo
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabla principal de envíos de CV
CREATE TABLE IF NOT EXISTS cv_sends (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_email TEXT        NOT NULL,
  company_name  TEXT        NOT NULL DEFAULT 'Empresa desconocida',
  company_url   TEXT,
  job_title     TEXT,
  status        TEXT        NOT NULL DEFAULT 'pendiente'
                            CHECK (status IN ('pendiente','enviado','fallido','cancelado')),
  job_id        TEXT,       -- ID del job en BullMQ
  sent_at       TIMESTAMPTZ,
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cv_sends_user_id    ON cv_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_sends_status     ON cv_sends(status);
CREATE INDEX IF NOT EXISTS idx_cv_sends_job_id     ON cv_sends(job_id);
CREATE INDEX IF NOT EXISTS idx_cv_sends_created_at ON cv_sends(created_at DESC);

-- RLS
ALTER TABLE cv_sends ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cv_sends' AND policyname = 'Users view own cv_sends'
  ) THEN
    CREATE POLICY "Users view own cv_sends"
      ON cv_sends FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cv_sends' AND policyname = 'Service role manages cv_sends'
  ) THEN
    CREATE POLICY "Service role manages cv_sends"
      ON cv_sends FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Reparar registros existentes con status='enviado' pero sent_at NULL
-- Usamos created_at como aproximación cuando no hay timestamp real
UPDATE cv_sends
SET sent_at = created_at
WHERE status = 'enviado'
  AND sent_at IS NULL;
