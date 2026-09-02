-- 018_nacionalidad.sql
--
-- De dónde es cada persona.
--
-- EL AGUJERO. Toda la ayuda de la aplicación estaba escrita dando por hecho
-- que quien la usa es español o de la UE: la acreditación de competencias pide
-- nacionalidad española o permiso de residencia, el formulario U2 exige estar
-- cobrando paro en la UE, y las fichas de au pair dicen "puedes ir sin visado"
-- porque hay libre circulación.
--
-- Nada de eso vale para un argentino. Y no sabíamos de dónde era nadie: el
-- perfil guarda ciudad, provincia y código postal —todo pensado para España— y
-- ni un campo de nacionalidad. Sabíamos a dónde quería ir cada uno, pero no de
-- dónde salía, que es lo que decide qué puede hacer.
--
-- Se guarda el código de dos letras (ES, AR, CO...). Puede quedarse vacío: no
-- se obliga a nadie a declararlo, y mientras esté vacío la aplicación pregunta
-- en vez de suponer.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nacionalidad TEXT;

COMMENT ON COLUMN profiles.nacionalidad IS
  'Codigo ISO de dos letras del pais de nacionalidad. Decide que regimen de movilidad le aplica: ver lib/origen/movilidad.ts';

-- Para poder contar de donde viene la gente sin recorrer toda la tabla.
CREATE INDEX IF NOT EXISTS idx_profiles_nacionalidad ON profiles (nacionalidad);
