-- 019_correo_verificado.sql
--
-- LO QUE SE ESCRIBE DESDE EL NAVEGADOR TAMBIÉN PIDE EL CORREO VERIFICADO.
--
-- POR QUÉ (7 nov 2026). Desde que "Confirm email" está apagado se entra sin
-- confirmar el correo, y para HACER algo hace falta tenerlo verificado. Las
-- rutas de la API lo comprueban en el servidor (lib/auth-server.ts,
-- correoSinVerificar). Pero tres pantallas escriben en Supabase directamente
-- desde el navegador, con la sesión de la persona, sin pasar por la API:
--
--   · cv_sends            → el Pipeline (añadir y mover candidaturas a mano)
--   · gusi_conversations  → guardar y borrar las conversaciones con Guzzi
--   · profiles            → la nacionalidad y el aviso por WhatsApp
--
-- Ahí la única puerta es la seguridad por filas. Esto añade, en esas tres
-- tablas, una política RESTRICTIVA para escribir: además de lo que ya pidieran
-- las suyas (cada quien, lo suyo), hace falta el correo verificado. Leer no
-- cambia. El servidor usa la clave de servicio, que se salta todo esto.
--
-- LA REGLA ES LA MISMA QUE lib/auth/correo-verificado.ts:
--   app_metadata.correo_verificado_en (la marca que pone nuestro enlace), o
--   email_confirmed_at anterior al 7 nov 2026 19:00 UTC (hasta entonces
--   "Confirm email" estaba activado y solo lo ponía un enlace del correo).
--
-- SE EJECUTA DESPUÉS DE DESPLEGAR EL CÓDIGO del 7 nov 2026, en el editor SQL
-- de Supabase. Es repetible. No se ha ejecutado contra ninguna base al
-- escribirla: el SELECT del final dice si ha quedado puesta.

-- 1. ¿Tiene quien llama el correo verificado?
CREATE OR REPLACE FUNCTION public.correo_verificado()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
      AND (
        coalesce(u.raw_app_meta_data ->> 'correo_verificado_en', '') <> ''
        OR u.email_confirmed_at < timestamptz '2026-11-07 19:00:00+00'
      )
  );
$$;

REVOKE ALL ON FUNCTION public.correo_verificado() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.correo_verificado() TO authenticated;

-- 2. Escribir pide el correo verificado (restrictivas: se suman a las que ya hay).
DROP POLICY IF EXISTS "correo_verificado_insert" ON public.cv_sends;
CREATE POLICY "correo_verificado_insert" ON public.cv_sends AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (public.correo_verificado());
DROP POLICY IF EXISTS "correo_verificado_update" ON public.cv_sends;
CREATE POLICY "correo_verificado_update" ON public.cv_sends AS RESTRICTIVE
  FOR UPDATE TO authenticated USING (public.correo_verificado()) WITH CHECK (public.correo_verificado());

DROP POLICY IF EXISTS "correo_verificado_insert" ON public.gusi_conversations;
CREATE POLICY "correo_verificado_insert" ON public.gusi_conversations AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (public.correo_verificado());
DROP POLICY IF EXISTS "correo_verificado_update" ON public.gusi_conversations;
CREATE POLICY "correo_verificado_update" ON public.gusi_conversations AS RESTRICTIVE
  FOR UPDATE TO authenticated USING (public.correo_verificado()) WITH CHECK (public.correo_verificado());
DROP POLICY IF EXISTS "correo_verificado_delete" ON public.gusi_conversations;
CREATE POLICY "correo_verificado_delete" ON public.gusi_conversations AS RESTRICTIVE
  FOR DELETE TO authenticated USING (public.correo_verificado());

DROP POLICY IF EXISTS "correo_verificado_update" ON public.profiles;
CREATE POLICY "correo_verificado_update" ON public.profiles AS RESTRICTIVE
  FOR UPDATE TO authenticated USING (public.correo_verificado()) WITH CHECK (public.correo_verificado());

-- 3. Comprobación. Debe salir rls_activo = true en las tres tablas y seis
--    políticas "correo_verificado_*". Si una tabla sale con rls_activo = false,
--    sus políticas no hacen nada: avisar antes de activarla (activarla sin
--    políticas propias la dejaría cerrada para todo el mundo).
SELECT c.relname AS tabla, c.relrowsecurity AS rls_activo,
       count(p.policyname) FILTER (WHERE p.policyname LIKE 'correo_verificado_%') AS politicas_correo
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
LEFT JOIN pg_policies p ON p.schemaname = 'public' AND p.tablename = c.relname
WHERE c.relname IN ('cv_sends', 'gusi_conversations', 'profiles')
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;
