-- ═══════════════════════════════════════════════════════════════════════════
-- Migración 008: Expandir CHECK constraint de cv_sends para aceptar 'visto' y 'respondido'
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Eliminar el CHECK constraint existente
ALTER TABLE cv_sends DROP CONSTRAINT IF EXISTS cv_sends_status_check;

-- Recrear con los nuevos valores permitidos
ALTER TABLE cv_sends ADD CONSTRAINT cv_sends_status_check
  CHECK (status IN ('pendiente', 'enviado', 'fallido', 'cancelado', 'visto', 'respondido'));
