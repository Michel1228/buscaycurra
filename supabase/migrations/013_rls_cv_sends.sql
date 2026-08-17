-- 013_rls_cv_sends.sql — Cerrar la tabla cv_sends, que estaba abierta al público.
--
-- QUÉ PASABA. La tabla no tenía activada la seguridad por filas, así que
-- cualquiera podía leerla entera con la clave anónima — la que va incrustada en
-- el JavaScript de todas las páginas y que cualquiera ve con abrir el navegador.
--
-- Comprobado el 17 de agosto de 2026 contra producción:
--
--   curl ".../rest/v1/cv_sends?select=id" -H "apikey: sb_publishable_..."
--   → Content-Range: 0-0/112        (112 filas servidas)
--
--   La misma petición contra `profiles` devuelve []  (esa sí está protegida)
--
-- Lo que quedaba expuesto: el CV completo guardado en `cv_snapshot` (nombre,
-- email, ciudad, foto, idiomas), la carta de presentación y el email de la
-- empresa a la que se escribió. Datos personales de usuarios reales.
--
-- El servidor NO se ve afectado por este cambio: todas las rutas de la
-- aplicación usan SUPABASE_SERVICE_ROLE_KEY, que se salta la seguridad por
-- filas por definición. Esto solo cierra la puerta de la clave anónima.
--
-- Es idempotente a propósito: el editor SQL de Supabase envuelve todo en una
-- transacción y un error de "ya existe" tira abajo el bloque entero.

ALTER TABLE public.cv_sends ENABLE ROW LEVEL SECURITY;

-- Cada quien ve lo suyo y nada más.
DROP POLICY IF EXISTS "cv_sends_select_propio" ON public.cv_sends;
CREATE POLICY "cv_sends_select_propio" ON public.cv_sends
  FOR SELECT
  USING (auth.uid() = user_id);

-- Insertar solo en nombre propio. Sin esto, un anónimo podría escribir filas
-- falsas en el historial de envíos de otra persona.
DROP POLICY IF EXISTS "cv_sends_insert_propio" ON public.cv_sends;
CREATE POLICY "cv_sends_insert_propio" ON public.cv_sends
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Actualizar solo lo propio (marcar como leído, ocultar del historial...).
DROP POLICY IF EXISTS "cv_sends_update_propio" ON public.cv_sends;
CREATE POLICY "cv_sends_update_propio" ON public.cv_sends
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No se crea política de DELETE a propósito: sin política, nadie puede borrar
-- con la clave anónima. El borrado real lo hace el servidor con la clave de
-- servicio. Así el historial de envíos no se puede vaciar desde fuera, que es
-- lo que ya se blindó en la migración 012.

-- Comprobación posterior (debe devolver 4 filas: la tabla y sus 3 políticas):
--   SELECT tablename, policyname FROM pg_policies WHERE tablename = 'cv_sends';
--   SELECT relrowsecurity FROM pg_class WHERE relname = 'cv_sends';   → debe ser true
