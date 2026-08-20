-- 013c — Devolver a los usuarios el permiso sobre sus propios envíos.
--
-- QUÉ PASÓ. La migración 013b cerró la fuga de cv_sends, que estaba sirviendo
-- 112 filas con CV y cartas a cualquiera. Para eso hizo, entre otras cosas:
--
--     REVOKE ALL ON public.cv_sends FROM anon;
--
-- Y eso se llevó por delante más de lo previsto: el rol `authenticated` se
-- quedó también sin permiso sobre la tabla. Comprobado el 21 de agosto con un
-- usuario real, sobre una fila suya:
--
--     PATCH /rest/v1/cv_sends?id=eq.<fila propia>
--     → {"code":"42501","message":"permission denied for table cv_sends"}  403
--
-- Consecuencia para el usuario: en el Pipeline, al guardar las notas de una
-- candidatura, la pantalla las daba por guardadas y al recargar habían
-- desaparecido. El código no miraba el error que devuelve Supabase.
--
-- Los envíos de CV NO se vieron afectados: los hace el servidor con la clave
-- de servicio, que se salta todo esto.
--
-- LO QUE HACE ESTA MIGRACIÓN. Devuelve el permiso a `authenticated` —y solo a
-- ese rol— dejando intacto el cierre para el anónimo. La seguridad no se
-- relaja: las políticas de la 013b siguen limitando cada fila a su dueño, así
-- que un usuario autenticado solo puede tocar lo suyo. El permiso de tabla es
-- la puerta; la política es quien mira el DNI.
--
-- No se concede DELETE a propósito: el historial de envíos no debe poder
-- vaciarse desde el navegador, porque de él sale el cálculo de la cuota.

GRANT SELECT, INSERT, UPDATE ON public.cv_sends TO authenticated;

-- Y que quede claro que el anónimo sigue fuera.
REVOKE ALL ON public.cv_sends FROM anon;

-- Comprobación. Debe devolver tres filas: SELECT, INSERT y UPDATE para
-- authenticated, y ninguna para anon.
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'cv_sends'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;
