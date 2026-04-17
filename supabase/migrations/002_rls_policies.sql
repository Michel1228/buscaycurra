-- ═══════════════════════════════════════════════════════════════════════════
-- Migración 002: Políticas Row Level Security (RLS) para todas las tablas
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Objetivo de seguridad:
--   Garantizar que — incluso si un atacante obtiene la clave pública anónima
--   (NEXT_PUBLIC_SUPABASE_ANON_KEY) — solo pueda leer/modificar las filas
--   que le pertenezcan. El service_role del backend sigue pudiendo operar
--   sin restricciones (bypass de RLS).
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── profiles ────────────────────────────────────────────────────────────────
-- Cada usuario solo puede ver y actualizar su propia fila (id = auth.uid()).

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Las inserciones de profiles las hace el trigger de auth (service_role),
-- así que no se expone política de INSERT para el cliente.

-- ─── cvs ─────────────────────────────────────────────────────────────────────
-- Cada usuario solo accede a sus propios CVs.

ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cvs_select_own" ON cvs;
CREATE POLICY "cvs_select_own"
ON cvs FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cvs_insert_own" ON cvs;
CREATE POLICY "cvs_insert_own"
ON cvs FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cvs_update_own" ON cvs;
CREATE POLICY "cvs_update_own"
ON cvs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cvs_delete_own" ON cvs;
CREATE POLICY "cvs_delete_own"
ON cvs FOR DELETE
USING (auth.uid() = user_id);

-- ─── cv_sends ────────────────────────────────────────────────────────────────
-- Historial de envíos de CV. Solo lectura por el propio usuario.
-- Las inserciones/actualizaciones las hace el worker con service_role.

ALTER TABLE cv_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cv_sends_select_own" ON cv_sends;
CREATE POLICY "cv_sends_select_own"
ON cv_sends FOR SELECT
USING (auth.uid() = user_id);

-- El usuario puede borrar su propio historial desde
-- /api/cuenta/limpiar-historial (que usa service_role), pero también
-- habilitamos DELETE vía RLS por si alguna acción cliente lo necesita.
DROP POLICY IF EXISTS "cv_sends_delete_own" ON cv_sends;
CREATE POLICY "cv_sends_delete_own"
ON cv_sends FOR DELETE
USING (auth.uid() = user_id);

-- ─── cv_blacklist ────────────────────────────────────────────────────────────
-- Lista de empresas a las que ya se envió CV (para respetar la regla de
-- 90 días). Solo lectura por el propio usuario desde el cliente.

ALTER TABLE cv_blacklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cv_blacklist_select_own" ON cv_blacklist;
CREATE POLICY "cv_blacklist_select_own"
ON cv_blacklist FOR SELECT
USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Notas de operación
-- ═══════════════════════════════════════════════════════════════════════════
-- • El service_role bypasea RLS → todas las rutas /api/* (que usan
--   SUPABASE_SERVICE_ROLE_KEY) siguen funcionando sin cambios.
-- • El cliente (anon key) ahora solo puede leer/escribir sus propios datos.
-- • Si en el futuro añades nuevas tablas con datos de usuario, recuerda:
--     1. ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
--     2. Crear políticas USING (auth.uid() = user_id);
