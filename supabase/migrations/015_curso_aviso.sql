-- 015_curso_aviso.sql
--
-- El interruptor de avisos de un curso.
--
-- POR QUÉ NO VALÍA curso_interes. Esa tabla registra ACCIONES: una fila cada
-- vez que alguien prepara una solicitud o se va a inscribir. Sirve para ver el
-- embudo, y por eso no se puede borrar ni cambiar una fila cuando alguien
-- decide que ya no quiere recibir avisos — perderíamos la historia.
--
-- Esto es otra cosa: un estado, uno solo por persona y curso, que se enciende y
-- se apaga. Si van juntas, apagar el aviso borraría la estadística o la
-- estadística resucitaría el aviso. Separadas, cada una hace lo suyo.
--
-- Y lo importante de verdad: mientras esto no exista, "avísame" es una promesa
-- que no podemos cumplir. Quien lo pulsa espera que le llegue algo.

CREATE TABLE IF NOT EXISTS curso_aviso (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  curso_slug   TEXT NOT NULL,          -- 'carretillero'
  curso_nombre TEXT,                   -- copia legible, por si cambia el catálogo

  -- Se apaga poniendo esto en false, no borrando la fila: así se puede volver a
  -- encender sin perder desde cuándo lo tenía puesto.
  activo       BOOLEAN NOT NULL DEFAULT TRUE,

  -- Última vez que se le avisó de este curso. Es lo que impide repetir: el
  -- proceso que manda los avisos no toca a nadie avisado hace menos de 14 días.
  -- Va aquí y no en Redis para que sobreviva a un vaciado de caché — un aviso
  -- repetido es de las pocas cosas que hacen que alguien se dé de baja.
  avisado_en   TIMESTAMPTZ,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Una sola fila por persona y curso. El endpoint hace UPSERT contra esto.
  UNIQUE (user_id, curso_slug)
);

-- Para el proceso diario: "dame los avisos encendidos que tocan".
CREATE INDEX IF NOT EXISTS idx_curso_aviso_pendientes
  ON curso_aviso (curso_slug)
  WHERE activo;

-- Para pintar el estado del interruptor al abrir la ficha.
CREATE INDEX IF NOT EXISTS idx_curso_aviso_usuario
  ON curso_aviso (user_id);

ALTER TABLE curso_aviso ENABLE ROW LEVEL SECURITY;

-- Cada uno ve y cambia lo suyo. Escribir de verdad lo hace el servidor con
-- service_role, igual que en curso_interes, pero aquí SÍ dejamos que el propio
-- usuario lea su estado: la ficha necesita saber si ya lo tiene encendido.
CREATE POLICY "Cada uno ve sus avisos"
  ON curso_aviso FOR SELECT
  USING (auth.uid() = user_id);
