-- 012_blindar_plan_y_envios.sql
--
-- Cierra DOS agujeros verificados con pruebas reales contra producción
-- (5 ago 2026). Ambos permitían usar la app de pago gratis.
--
-- ── FALLO 1: cualquiera podía darse plan Empresa gratis ──────────────────
-- La política "Users update own profile" es a nivel de FILA (auth.uid() = id),
-- no de COLUMNA, y no había ningún REVOKE. Con solo su token de sesión, un
-- usuario podía ejecutar desde la consola del navegador:
--    supabase.from('profiles').update({ plan:'empresa', subscription_status:'active' })
-- PROBADO: la cuenta de prueba pasó de 'free' a 'empresa' (49,99 €/mes) sin pagar.
-- Solución: revocar UPDATE sobre toda la tabla y devolver permiso SOLO sobre
-- las columnas de perfil que el usuario sí debe poder editar. Las columnas de
-- plan quedan reservadas al service role (webhooks de Stripe y RevenueCat).
--
-- ── FALLO 2: cualquiera podía resetear su cuota de envíos ────────────────
-- La política de cv_sends era FOR ALL, que incluye DELETE. El límite de envíos
-- se calcula contando filas de cv_sends, así que bastaba con borrarlas para
-- volver a tener envíos disponibles, en bucle e ilimitadamente.
-- PROBADO: tras el DELETE, las filas del usuario pasaron de 1 a 0.
-- Solución: el usuario solo puede LEER su historial. Insertar/actualizar/borrar
-- es cosa del servidor (el service role se salta RLS).
--
-- El script es repetible: se puede ejecutar varias veces sin error.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. profiles: quitar el UPDATE general y conceder solo lo seguro
-- ─────────────────────────────────────────────────────────────────────────
REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM anon;

-- Columnas que el usuario SÍ puede editar desde la app (su perfil).
-- Cualquier columna no listada queda protegida, incluidas plan, plan_source,
-- subscription_status, stripe_customer_id y las de RevenueCat.
GRANT UPDATE (nombre, full_name, telefono, phone, ciudad, provincia, sector, linkedin_url, cv_url, updated_at)
  ON public.profiles TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. cv_sends: el usuario solo puede LEER su historial
-- ─────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cv_sends_own" ON public.cv_sends;
DROP POLICY IF EXISTS "cv_sends_select_own" ON public.cv_sends;

CREATE POLICY "cv_sends_select_own"
  ON public.cv_sends
  FOR SELECT
  USING (auth.uid() = user_id);

-- Cinturón y tirantes: sin permisos de tabla, aunque una futura política
-- volviera a abrirlo, el borrado seguiría bloqueado.
REVOKE INSERT, UPDATE, DELETE ON public.cv_sends FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.cv_sends FROM anon;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. usage_tracking: mismo riesgo (poner a cero los contadores de IA)
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.usage_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usage_tracking_own" ON public.usage_tracking;
DROP POLICY IF EXISTS "usage_tracking_select_own" ON public.usage_tracking;

CREATE POLICY "usage_tracking_select_own"
  ON public.usage_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.usage_tracking FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.usage_tracking FROM anon;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Comprobación final: DEBE DEVOLVER 0 FILAS.
--    Si devuelve alguna, el usuario aún puede tocar su plan.
-- ─────────────────────────────────────────────────────────────────────────
SELECT column_name, privilege_type, grantee
FROM information_schema.column_privileges
WHERE table_name = 'profiles'
  AND grantee = 'authenticated'
  AND privilege_type = 'UPDATE'
  AND column_name IN ('plan', 'plan_source', 'subscription_status');
