-- ═══════════════════════════════════════════════════════════════════════════
-- Migración 009: Unificar esquema push_subscriptions (columnas separadas)
-- ═══════════════════════════════════════════════════════════════════════════
-- Cambia de una columna JSON 'subscription' a columnas separadas
-- endpoint, p256dh, auth, alineando con el esquema usado en VPS PostgreSQL.
-- ═══════════════════════════════════════════════════════════════════════════

-- Añadir columnas separadas si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'push_subscriptions' AND column_name = 'endpoint') THEN
    ALTER TABLE push_subscriptions ADD COLUMN endpoint TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'push_subscriptions' AND column_name = 'p256dh') THEN
    ALTER TABLE push_subscriptions ADD COLUMN p256dh TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'push_subscriptions' AND column_name = 'auth') THEN
    ALTER TABLE push_subscriptions ADD COLUMN auth TEXT;
  END IF;
END $$;

-- Migrar datos existentes: extraer de la columna JSON 'subscription' a columnas separadas
UPDATE push_subscriptions
SET
  endpoint = (subscription::jsonb ->> 'endpoint'),
  p256dh   = (subscription::jsonb -> 'keys' ->> 'p256dh'),
  auth     = (subscription::jsonb -> 'keys' ->> 'auth')
WHERE subscription IS NOT NULL
  AND endpoint IS NULL;

-- Añadir constraint único para evitar duplicados (mismo esquema que VPS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'push_subscriptions_user_endpoint_unique'
  ) THEN
    ALTER TABLE push_subscriptions
      ADD CONSTRAINT push_subscriptions_user_endpoint_unique
      UNIQUE (user_id, endpoint);
  END IF;
END $$;

-- Índice para búsquedas por user_id
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
