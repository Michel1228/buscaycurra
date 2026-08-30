-- 014_curso_interes.sql
--
-- Quién se interesa por qué curso. Es la pieza que convierte la sección de
-- formación en algo nuestro en vez de un directorio que enlaza fuera.
--
-- Sirve para tres cosas, por orden de importancia:
--   1. Saber qué formación pide la gente DE VERDAD, no la que suponemos.
--   2. Que Guzzi pueda hacer seguimiento ("¿te apuntaste al de carretillero?").
--   3. Poder decirle a una academia "tengo 40 personas buscando esto en tu
--      ciudad" — que es lo único que de verdad se les puede vender.
--
-- Los cursos subvencionados públicos no tienen programa de afiliación: el SEPE
-- y los servicios autonómicos no dan comisión ni parámetro de referido. Así que
-- este registro es la única atribución real que podemos tener, y es nuestra.

CREATE TABLE IF NOT EXISTS curso_interes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  curso_slug   TEXT NOT NULL,          -- 'carretillero'
  curso_nombre TEXT,                   -- copia legible, para no depender del catálogo
  sector       TEXT,

  -- Qué hizo. Se guarda una fila por acción para poder ver el embudo:
  -- cuántos preparan la solicitud y cuántos llegan de verdad a inscribirse.
  accion       TEXT NOT NULL CHECK (accion IN ('preparado', 'ido_a_inscribir')),

  -- Dónde le mandamos, cuando la acción es 'ido_a_inscribir'
  destino_url  TEXT,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Para "qué cursos se piden más" y para el seguimiento de un usuario concreto
CREATE INDEX IF NOT EXISTS idx_curso_interes_slug    ON curso_interes (curso_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_curso_interes_usuario ON curso_interes (user_id, created_at DESC);

-- RLS: cada uno ve lo suyo; escribir solo el servidor (service_role), igual que
-- en cv_sends. Así un usuario no puede inflar las estadísticas a mano.
ALTER TABLE curso_interes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "curso_interes_select_propio" ON curso_interes;
CREATE POLICY "curso_interes_select_propio" ON curso_interes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "curso_interes_insert_servidor" ON curso_interes;
CREATE POLICY "curso_interes_insert_servidor" ON curso_interes
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
