-- ═══════════════════════════════════════════════════════════════════════════
-- Migración 002: Tablas completas para todas las funcionalidades de la app
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 0. FUNCIÓN AUXILIAR — Actualización automática de updated_at ────────────
-- Función reutilizable que actualiza el campo updated_at al valor actual
-- cuando se modifica cualquier fila. Se aplica como trigger en varias tablas.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ─── 1. PROFILES — Completar la tabla existente ───────────────────────────────
-- Añadir columnas que el worker.ts necesita y que pueden no existir aún.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Trigger para actualizar updated_at automáticamente en cada modificación
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ─── 2. CVS — Documentos CV de cada usuario ───────────────────────────────────
-- El worker consulta: .from("cvs").select("id, user_id, file_url, text_content, file_name")
--                      .eq("user_id", userId).eq("is_primary", true)

CREATE TABLE IF NOT EXISTS cvs (
  id           UUID      DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID      REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_url     TEXT      NOT NULL,
  file_name    TEXT,
  text_content TEXT,
  is_primary   BOOLEAN   DEFAULT false,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- Activar Row Level Security
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

-- Política: cada usuario solo puede ver y gestionar sus propios CVs
CREATE POLICY "Usuario accede a sus propios CVs"
  ON cvs
  FOR ALL
  USING (auth.uid() = user_id);

-- Índice para acelerar las búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs (user_id);

-- Trigger para actualizar updated_at automáticamente en cada modificación
DROP TRIGGER IF EXISTS trg_cvs_updated_at ON cvs;
CREATE TRIGGER trg_cvs_updated_at
  BEFORE UPDATE ON cvs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ─── 3. CV_SENDS — Historial de envíos de CV ─────────────────────────────────
-- Usado por tracker.ts (recordSent, getUserSendHistory, canSendToCompany)
-- y por las rutas de API /api/cuenta (borrar, limpiar-historial).

CREATE TABLE IF NOT EXISTS cv_sends (
  id            UUID      DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID      REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_email TEXT      NOT NULL,
  company_name  TEXT      NOT NULL DEFAULT 'Empresa desconocida',
  company_url   TEXT,
  job_title     TEXT,
  status        TEXT      NOT NULL DEFAULT 'pendiente'
                          CHECK (status IN ('pendiente', 'enviado', 'fallido', 'cancelado')),
  job_id        TEXT,
  sent_at       TIMESTAMP,
  error_message TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Activar Row Level Security
ALTER TABLE cv_sends ENABLE ROW LEVEL SECURITY;

-- Política: cada usuario solo puede ver y gestionar sus propios envíos
CREATE POLICY "Usuario accede a sus propios envíos"
  ON cv_sends
  FOR ALL
  USING (auth.uid() = user_id);

-- Índices para las consultas frecuentes del tracker y el rate-limiter
CREATE INDEX IF NOT EXISTS idx_cv_sends_user_id      ON cv_sends (user_id);
CREATE INDEX IF NOT EXISTS idx_cv_sends_company_email ON cv_sends (company_email);
CREATE INDEX IF NOT EXISTS idx_cv_sends_status        ON cv_sends (status);
CREATE INDEX IF NOT EXISTS idx_cv_sends_sent_at       ON cv_sends (sent_at);


-- ─── 4. CV_BLACKLIST — Empresas bloqueadas ────────────────────────────────────
-- Usado por rate-limiter.ts: isInBlacklist, addToBlacklist, removeFromBlacklist,
-- getBlacklist. Solo el rol de servicio (admins) puede gestionar esta tabla.

CREATE TABLE IF NOT EXISTS cv_blacklist (
  id            UUID      DEFAULT gen_random_uuid() PRIMARY KEY,
  company_email TEXT      UNIQUE NOT NULL,
  reason        TEXT      DEFAULT 'No especificado',
  added_at      TIMESTAMP DEFAULT NOW()
);

-- Activar Row Level Security
ALTER TABLE cv_blacklist ENABLE ROW LEVEL SECURITY;

-- Política: solo el service role (admins) puede leer y modificar la blacklist.
-- El acceso desde el código de la app se realiza siempre con la clave de servicio
-- (SUPABASE_SERVICE_ROLE_KEY), por lo que no es necesaria una política de lectura
-- para usuarios autenticados.
CREATE POLICY "Solo admins gestionan la blacklist"
  ON cv_blacklist
  FOR ALL
  USING (auth.role() = 'service_role');


-- ─── 5. NOTIFICACIONES_CONFIG — Preferencias de alertas por email ─────────────
-- Usado por el módulo de notificaciones del PR #10 (bloque 1).
-- Cada usuario tiene una fila con sus preferencias.

CREATE TABLE IF NOT EXISTS notificaciones_config (
  user_id        UUID    REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email_inmediato BOOLEAN DEFAULT true,
  resumen_diario  BOOLEAN DEFAULT true,
  alerta_respuestas BOOLEAN DEFAULT true,
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Activar Row Level Security
ALTER TABLE notificaciones_config ENABLE ROW LEVEL SECURITY;

-- Política: cada usuario gestiona únicamente su propia configuración
CREATE POLICY "Usuario gestiona su configuración de notificaciones"
  ON notificaciones_config
  FOR ALL
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at automáticamente en cada modificación
DROP TRIGGER IF EXISTS trg_notificaciones_config_updated_at ON notificaciones_config;
CREATE TRIGGER trg_notificaciones_config_updated_at
  BEFORE UPDATE ON notificaciones_config
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ─── 6. REFERIDOS — Sistema de referidos ─────────────────────────────────────
-- Usado por el módulo de referidos del PR #10 (bloque 7).

CREATE TABLE IF NOT EXISTS referidos (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referidor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referido_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo       TEXT UNIQUE NOT NULL,
  estado       TEXT DEFAULT 'pendiente'
               CHECK (estado IN ('pendiente', 'completado', 'recompensado')),
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Activar Row Level Security
ALTER TABLE referidos ENABLE ROW LEVEL SECURITY;

-- Política: cada usuario solo puede ver sus propios referidos (como referidor)
CREATE POLICY "Usuario accede a sus propios referidos"
  ON referidos
  FOR ALL
  USING (auth.uid() = referidor_id);

-- Índice para acelerar las búsquedas por referidor
CREATE INDEX IF NOT EXISTS idx_referidos_referidor_id ON referidos (referidor_id);


-- ─── 7. ENTREVISTAS — Historial del simulador de entrevistas ─────────────────
-- Usado por el simulador de entrevistas con IA del PR #10 (bloque 3).

CREATE TABLE IF NOT EXISTS entrevistas (
  id                   UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID         REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  puesto               TEXT         NOT NULL,
  nivel                TEXT         NOT NULL DEFAULT 'mid',
  tipo                 TEXT         NOT NULL DEFAULT 'mixta',
  puntuacion_media     NUMERIC(4,2),
  preguntas_respondidas INT         DEFAULT 0,
  resumen              JSONB,
  created_at           TIMESTAMP    DEFAULT NOW()
);

-- Activar Row Level Security
ALTER TABLE entrevistas ENABLE ROW LEVEL SECURITY;

-- Política: cada usuario solo puede ver sus propias entrevistas
CREATE POLICY "Usuario accede a sus propias entrevistas"
  ON entrevistas
  FOR ALL
  USING (auth.uid() = user_id);

-- Índice para acelerar las búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_entrevistas_user_id ON entrevistas (user_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- FIN DE LA MIGRACIÓN 002
-- ═══════════════════════════════════════════════════════════════════════════
-- Instrucciones:
--   1. Ve a Supabase Dashboard → SQL Editor
--   2. Pega el contenido de este archivo
--   3. Haz clic en "Run" para ejecutar la migración
--   4. Verifica en Table Editor que se han creado todas las tablas
-- ═══════════════════════════════════════════════════════════════════════════
