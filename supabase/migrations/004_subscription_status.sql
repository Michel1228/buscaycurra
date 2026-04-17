-- ═══════════════════════════════════════════════════════════════════════════
-- Migración 004: Estado de suscripción en profiles
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Objetivo:
--   Reflejar el estado real de la suscripción Stripe del usuario para poder:
--     - Avisarle cuando falle un pago de renovación (past_due)
--     - Saber si está en periodo de gracia o cancelada
--     - Mantener el plan activo hasta el final del periodo pagado
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Estado de la suscripción (sigue los valores estándar de Stripe)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

-- ID de la suscripción activa (para actualizarla desde el webhook)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Fecha en que termina el periodo pagado actualmente (por si cancela)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

COMMENT ON COLUMN profiles.subscription_status IS
  'Estado Stripe: active, past_due, canceled, inactive, trialing, unpaid';
