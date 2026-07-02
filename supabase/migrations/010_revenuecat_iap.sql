-- ═══════════════════════════════════════════════════════════════════════════
-- Migración 010: Integración de Apple In-App Purchase vía RevenueCat
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar en: https://supabase.com/dashboard/project/ojesordjedovnpyxspxi/sql
-- ═══════════════════════════════════════════════════════════════════════════
-- Contexto: Apple (Guideline 3.1.1) exige que las suscripciones se compren
-- mediante In-App Purchase dentro de la app iOS. Añadimos RevenueCat como
-- segunda pasarela (iOS), conviviendo con Stripe (web). Estas columnas permiten
-- distinguir el origen del plan y evitar cobros duplicados entre plataformas.

-- ─── Origen del plan: 'stripe' (web) | 'revenuecat' (iOS IAP) | NULL (free) ──
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_source TEXT;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_source_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_source_check
  CHECK (plan_source IS NULL OR plan_source IN ('stripe', 'revenuecat'));

-- ─── Identificadores de RevenueCat para trazabilidad y soporte ───────────────
-- revenuecat_app_user_id coincide con profiles.id (lo configuramos como appUserID
-- en el cliente), pero se persiste explícitamente para diagnóstico.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS revenuecat_app_user_id          TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS revenuecat_original_app_user_id TEXT;

-- Índices para las búsquedas del webhook y reporting
CREATE INDEX IF NOT EXISTS idx_profiles_plan_source            ON profiles(plan_source);
CREATE INDEX IF NOT EXISTS idx_profiles_revenuecat_app_user_id ON profiles(revenuecat_app_user_id);

-- ─── Backfill: hasta ahora la única pasarela era Stripe ──────────────────────
-- Cualquier usuario con plan de pago activo antes de esta migración pagó por Stripe.
UPDATE profiles
SET plan_source = 'stripe'
WHERE plan_source IS NULL
  AND plan <> 'free'
  AND stripe_customer_id IS NOT NULL;

-- ─── Idempotencia de eventos de RevenueCat (mismo patrón que stripe_events) ──
CREATE TABLE IF NOT EXISTS revenuecat_events (
  id          TEXT        PRIMARY KEY,   -- event.id del payload de RevenueCat
  event_type  TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
