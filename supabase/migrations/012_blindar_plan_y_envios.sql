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
-- PROBADO: el DELETE devolvió HTTP 204 (permitido).
-- Solución: el usuario solo puede LEER su historial. Insertar/actualizar/borrar
-- es cosa del servidor (el service role se salta RLS).

-- ─────────────────────────────────────────────────────────────────────────
-- 1. profiles: quitar el UPDATE general y conceder solo lo seguro
-- ─────────────────────────────────────────────────────────────────────────
REVOKE UPDATE ON public.profiles FROM authenticated, anon;

-- Columnas que el usuario SÍ puede editar desde la app (su perfil).
-- Se conceden una a una: cualquier columna no listada queda protegida,
-- incluidas plan, plan_source, subscription_status, stripe_customer_id,
-- stripe_subscription_id, current_period_end y las de RevenueCat.
GRANT UPDATE (
  nombre,
  full_name,
  telefono,
  phone,
  ciudad,
  provincia,
  sector,
  linkedin_url,
  cv_url,
  updated_at
) ON public.profiles TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. cv_sends: solo lectura para el usuario
-- ─────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cv_sends_own" ON public.cv_sends;

CREATE POLICY "cv_sends_select_own"
  ON public.cv_sends
  FOR SELECT
  USING (auth.uid() = user_id);

-- Cinturón y tirantes: aunque no quede ninguna política de escritura, se
-- revocan también los permisos de tabla para que un futuro cambio de RLS no
-- reabra el agujero.
REVOKE INSERT, UPDATE, DELETE ON public.cv_sends FROM authenticated, anon;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. usage_tracking: mismo riesgo (resetear cuotas de IA a mano)
-- ─────────────────────────────────────────────────────────────────────────
-- Guarda los contadores de consultas a Guzzi y usos de cámara. Si el usuario
-- pudiera escribirla, se pondría los contadores a cero y tendría IA ilimitada.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'usage_tracking') THEN
    EXECUTE 'ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "usage_tracking_own" ON public.usage_tracking';
    EXECUTE 'DROP POLICY IF EXISTS "usage_tracking_select_own" ON public.usage_tracking';
    EXECUTE 'CREATE POLICY "usage_tracking_select_own" ON public.usage_tracking
             FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'REVOKE INSERT, UPDATE, DELETE ON public.usage_tracking FROM authenticated, anon';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Comprobación: debe devolver 0 filas de UPDATE para authenticated
--    sobre las columnas de plan.
-- ─────────────────────────────────────────────────────────────────────────
SELECT column_name, privilege_type, grantee
FROM information_schema.column_privileges
WHERE table_name = 'profiles'
  AND grantee = 'authenticated'
  AND privilege_type = 'UPDATE'
  AND column_name IN ('plan', 'plan_source', 'subscription_status');
