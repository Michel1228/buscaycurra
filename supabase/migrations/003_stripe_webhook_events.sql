-- ═══════════════════════════════════════════════════════════════════════════
-- Migración 003: Tabla de idempotencia para webhooks de Stripe
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Objetivo:
--   Stripe reenvía un mismo evento varias veces si no respondemos con 2xx
--   rápido. Sin idempotencia, un "checkout.session.completed" duplicado
--   podía activar el plan dos veces, registrar pagos fantasma, etc.
--
--   Antes de procesar cualquier evento insertamos su event_id en esta tabla.
--   Si la inserción falla por la restricción UNIQUE, significa que ya lo
--   procesamos y lo ignoramos devolviendo 200 OK a Stripe.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id   TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para limpieza futura por antigüedad (si se decide purgar > 90 días).
CREATE INDEX IF NOT EXISTS stripe_webhook_events_created_at_idx
ON stripe_webhook_events (created_at);

-- RLS: la tabla solo se maneja desde el backend con service_role.
-- Habilitamos RLS sin políticas para bloquear cualquier acceso desde el
-- cliente (anon key), que no tiene razón para ver estos eventos.
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
