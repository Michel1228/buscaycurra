-- 013b — Cerrar cv_sends DE VERDAD, y decir por pantalla si ha funcionado.
--
-- POR QUÉ HAY UNA SEGUNDA VERSIÓN. La 013 se ejecutó sin errores y la tabla
-- SIGUIÓ sirviendo las 112 filas a cualquiera con la clave anónima. El motivo:
-- aquella migración solo borraba las tres políticas que ella misma crea, así
-- que si ya existía otra con otro nombre —del tipo "permitir todo"— esa seguía
-- ahí y bastaba para dejar pasar a todo el mundo. Activar la seguridad por
-- filas no sirve de nada si queda una política que dice que sí.
--
-- Esta versión borra TODAS las políticas de la tabla, sean cuales sean, y
-- después crea solo las correctas. Además quita los permisos directos que el
-- rol anónimo pudiera tener sobre la tabla, que es el otro camino de entrada.
--
-- Y TERMINA ENSEÑANDO EL RESULTADO. La anterior no devolvía ninguna fila, así
-- que no había forma de saber si había hecho algo. Esta acaba con un SELECT:
-- si al final ves una tabla con "rls_activo = true" y tres políticas, está
-- cerrado.

-- 1. Fuera todas las políticas que haya ahora mismo, se llamen como se llamen.
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'cv_sends'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.cv_sends', p.policyname);
  END LOOP;
END $$;

-- 2. Activar la seguridad por filas, y forzarla también para el dueño de la
--    tabla. Sin FORCE, el propietario se la salta.
ALTER TABLE public.cv_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_sends FORCE ROW LEVEL SECURITY;

-- 3. Quitar el acceso directo del rol anónimo. Aunque las políticas ya lo
--    cubren, esto cierra la puerta antes de llegar a ellas.
REVOKE ALL ON public.cv_sends FROM anon;

-- 4. Ahora sí, las tres políticas correctas: cada quien, lo suyo.
CREATE POLICY "cv_sends_select_propio" ON public.cv_sends
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "cv_sends_insert_propio" ON public.cv_sends
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cv_sends_update_propio" ON public.cv_sends
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Sin política de DELETE a propósito: así el historial de envíos no se puede
-- vaciar desde fuera. El borrado real lo hace el servidor con la clave de
-- servicio, que se salta todo esto por definición — la aplicación no se ve
-- afectada por ninguno de estos cambios.

-- 5. El resultado, para poder verlo. ESTO SÍ DEVUELVE FILAS.
SELECT
  c.relname                                   AS tabla,
  c.relrowsecurity                            AS rls_activo,
  c.relforcerowsecurity                       AS rls_forzado,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cv_sends') AS politicas,
  CASE
    WHEN c.relrowsecurity AND (SELECT count(*) FROM pg_policies
      WHERE schemaname='public' AND tablename='cv_sends') = 3
    THEN 'CERRADO CORRECTAMENTE'
    ELSE 'SIGUE MAL — avisa'
  END                                         AS veredicto
FROM pg_class c
WHERE c.relname = 'cv_sends';
