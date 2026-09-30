-- 007_correos_rebotados.sql
-- Direcciones a las que no hay que volver a escribir.
--
-- Del 1 al 29 sep 2026 rebotaron 392 correos de alertas, todos a dos cuentas
-- de prueba (audit21@ y auditoria_test@buscaycurra.es) que no tienen buzón:
-- entre 8 y 16 al día, frente a 218 alertas que sí llegaron. Esa tasa de rebote
-- perjudica la entrega de TODO lo que sale de noreply@buscaycurra.es. El aviso
-- de Resend (/api/cv-sender/entrega) solo se usaba para los CV; ahora anota
-- aquí cualquier rebote o queja, y lib/email/smtp-sender.ts lo consulta antes
-- de enviar.

CREATE TABLE IF NOT EXISTS correos_rebotados (
  email       TEXT PRIMARY KEY,          -- siempre en minúsculas
  permanente  BOOLEAN NOT NULL DEFAULT false,  -- rebote en firme o queja de spam
  veces       INTEGER NOT NULL DEFAULT 1,
  motivo      TEXT,
  ultimo      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
