-- 011_cv_sends_hidden.sql
-- Soft-delete de envíos de CV.
--
-- Antes, "borrar historial" hacía DELETE físico en cv_sends. Como el rate-limiter
-- y el anti-spam de 15 días cuentan filas de esa tabla, borrar reseteaba la cuota:
-- un usuario Free podía enviar, borrar y reenviar sin límite real.
--
-- Con esta columna, "borrar" marca hidden=true: la fila desaparece del historial
-- visible del usuario pero SIGUE contando para límites y anti-spam.

ALTER TABLE cv_sends
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;

-- Índice parcial para que las consultas del historial (que filtran hidden=false)
-- sigan siendo rápidas por usuario.
CREATE INDEX IF NOT EXISTS idx_cv_sends_user_visible
  ON cv_sends (user_id, created_at DESC)
  WHERE hidden = false;
