-- 016_curso_progreso.sql
--
-- Lo que cada persona lleva hecho con un curso.
--
-- EL AGUJERO QUE TAPA. El preparador de solicitudes escribía la carta con el CV
-- de la persona, se la enseñaba en pantalla… y no la guardaba en ninguna parte.
-- Cerrabas la pestaña y desaparecía. Había que volver a generarla, gastando otra
-- llamada al modelo, y con un texto distinto porque no es determinista.
--
-- Para las ofertas de trabajo esto existe desde siempre: saved_jobs y el
-- pipeline. Para los cursos no había nada. Alguien podía preparar la solicitud
-- del carretillero un martes y el jueves no tener forma de recuperarla.
--
-- POR QUÉ UNA TABLA APARTE DE curso_interes Y curso_aviso. Son tres cosas
-- distintas y mezclarlas las estropea:
--
--   curso_interes  · el registro de acciones. Una fila por cada vez. No se
--                    toca nunca, porque es de donde sale el embudo.
--   curso_aviso    · el interruptor de avisos. Un estado que se enciende y se
--                    apaga.
--   curso_progreso · esto. Lo que es SUYO: su carta, sus papeles, por dónde va.
--                    Se edita constantemente y se puede borrar sin perder ni
--                    la estadística ni el aviso.

CREATE TABLE IF NOT EXISTS curso_progreso (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  curso_slug   TEXT NOT NULL,
  curso_nombre TEXT,

  -- Por dónde va. Mismo espíritu que el pipeline de candidaturas: la gracia no
  -- es la etiqueta, es poder mirar la lista y ver qué tienes a medias.
  estado       TEXT NOT NULL DEFAULT 'guardado'
               CHECK (estado IN ('guardado', 'preparado', 'inscrito', 'haciendo', 'terminado')),

  -- La carta que le escribimos con su CV. Es lo más caro de regenerar y lo que
  -- de verdad se lleva puesto a la matrícula.
  carta        TEXT,

  -- La lista de papeles que le dimos, y cuáles ha conseguido ya. Guardar los
  -- dos permite enseñar "te faltan 2 de 5" sin volver a calcular la lista, que
  -- puede haber cambiado en el catálogo desde entonces.
  documentos        JSONB NOT NULL DEFAULT '[]'::jsonb,
  documentos_hechos JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Sus notas. El sitio para "llamé al centro, me dijeron que en septiembre".
  notas        TEXT,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Una fila por persona y curso. El preparador hace UPSERT contra esto.
  UNIQUE (user_id, curso_slug)
);

CREATE INDEX IF NOT EXISTS idx_curso_progreso_usuario
  ON curso_progreso (user_id, updated_at DESC);

ALTER TABLE curso_progreso ENABLE ROW LEVEL SECURITY;

-- Esto SÍ es del usuario, no estadística nuestra: puede verlo, cambiar su
-- estado y sus notas, y borrarlo cuando quiera. Escribir la carta la primera
-- vez lo hace el servidor con service_role, desde el preparador.
CREATE POLICY "Cada uno ve su progreso"
  ON curso_progreso FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Cada uno edita su progreso"
  ON curso_progreso FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Cada uno borra su progreso"
  ON curso_progreso FOR DELETE
  USING (auth.uid() = user_id);
