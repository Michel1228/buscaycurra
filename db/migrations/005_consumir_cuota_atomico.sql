-- 005_consumir_cuota_atomico.sql — Que dos peticiones a la vez no cuelen dos.
--
-- SE APLICA EN SUPABASE (proyecto ojesordjedovnpyxspxi), NO en la base propia.
-- Editor SQL: https://supabase.com/dashboard/project/ojesordjedovnpyxspxi/sql/new
--
-- EL PROBLEMA. Los contadores de cuota hacían leer → comprobar → escribir:
--
--     const { data } = await sb.from("usage_tracking").select("camara_usos")...
--     if (usos >= limite) return 429;
--     await sb.from("usage_tracking").upsert({ camara_usos: usos + 1 })
--
-- Entre la lectura y la escritura cabe otra petición. Diez a la vez leen todas
-- el mismo valor, las diez pasan la comprobación y las diez escriben "1". Un
-- usuario del plan gratuito, que tiene 2 fotos al día, se gasta diez llamadas a
-- la visión de GPT-4o — que se pagan por foto y son la llamada más cara de la
-- aplicación.
--
-- No se arregla en el código de la aplicación: se arregla haciendo que la base
-- de datos sume y compruebe EN LA MISMA OPERACIÓN. El `where` del `on conflict`
-- es lo que lo hace atómico: si ya se llegó al límite, no actualiza nada, no
-- devuelve fila, y la función devuelve NULL.
--
-- Devuelve: el número de usos DESPUÉS de sumar, o NULL si no quedaba cuota.
--
-- ─── Comprobado el 15 sep 2026, antes de aplicar ───────────────────────────
--
-- usage_tracking, según el catálogo de Supabase: clave primaria (user_id uuid,
-- date_key text), que es la que usa el ON CONFLICT; week_key text NOT NULL con
-- valor por defecto ''; guzzi_consultas integer NOT NULL por defecto 0; y
-- camara_usos integer por defecto 0 pero QUE ADMITE NULL.
--
-- Por eso los COALESCE. La primera versión de este fichero hacía
-- `camara_usos + 1` y `camara_usos < p_limite`. Con NULL, lo primero da NULL y
-- lo segundo nunca se cumple: a un usuario con el campo vacío no se le sumaría
-- nunca un uso y la función respondería "sin cuota" para siempre. Le habría
-- bloqueado la cámara sin haberla usado.
--
-- ─── Seguridad ─────────────────────────────────────────────────────────────
--
-- Son SECURITY DEFINER: se ejecutan con los permisos del propietario y se saltan
-- la seguridad por filas. Supabase concede EXECUTE a anon y authenticated en las
-- funciones nuevas de public, y como el usuario va como parámetro, cualquiera
-- con la clave pública podría llamar a /rest/v1/rpc/consumir_uso_camara con el
-- identificador de OTRO usuario y agotarle la cuota.
--
-- La migración supabase/migrations/012 ya quitó a esos roles el derecho a
-- escribir en usage_tracking justo para eso. Sin los REVOKE de abajo, estas
-- funciones lo volverían a abrir. Solo las llama el servidor (service_role).
--
-- search_path fijo: en una función SECURITY DEFINER, un search_path que dependa
-- del llamante permitiría hacerle usar otra tabla con el mismo nombre.
--
-- Todo va en una transacción: se aplica entero o no se aplica nada.

BEGIN;

CREATE OR REPLACE FUNCTION public.consumir_uso_camara(
  p_user_id  uuid,
  p_date_key text,
  p_limite   integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nuevo integer;
BEGIN
  -- Un plan sin cuota no consume: sin esto, la primera llamada del día
  -- insertaría un 1 aunque el límite fuera 0.
  IF p_limite IS NULL OR p_limite <= 0 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.usage_tracking (user_id, date_key, week_key, camara_usos)
  VALUES (p_user_id, p_date_key, '', 1)
  ON CONFLICT (user_id, date_key) DO UPDATE
    SET camara_usos = COALESCE(usage_tracking.camara_usos, 0) + 1
    WHERE COALESCE(usage_tracking.camara_usos, 0) < p_limite
  RETURNING camara_usos INTO v_nuevo;

  -- Sin fila devuelta = el WHERE no se cumplió = ya no queda cuota.
  RETURN v_nuevo;
END;
$$;

-- Lo mismo para las consultas a Guzzi, que tienen la misma carrera. Todavía no
-- la llama ningún código: lib/usage-tracker.ts sigue con leer-comprobar-escribir.
CREATE OR REPLACE FUNCTION public.consumir_consulta_guzzi(
  p_user_id  uuid,
  p_date_key text,
  p_limite   integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nuevo integer;
BEGIN
  IF p_limite IS NULL OR p_limite <= 0 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.usage_tracking (user_id, date_key, week_key, guzzi_consultas)
  VALUES (p_user_id, p_date_key, '', 1)
  ON CONFLICT (user_id, date_key) DO UPDATE
    SET guzzi_consultas = COALESCE(usage_tracking.guzzi_consultas, 0) + 1
    WHERE COALESCE(usage_tracking.guzzi_consultas, 0) < p_limite
  RETURNING guzzi_consultas INTO v_nuevo;

  RETURN v_nuevo;
END;
$$;

REVOKE ALL ON FUNCTION public.consumir_uso_camara(uuid, text, integer)     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consumir_consulta_guzzi(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consumir_uso_camara(uuid, text, integer)     TO service_role;
GRANT EXECUTE ON FUNCTION public.consumir_consulta_guzzi(uuid, text, integer) TO service_role;

COMMIT;

-- Que la API vea las funciones nuevas sin esperar.
NOTIFY pgrst, 'reload schema';

-- COMPROBACIÓN. Tienen que salir 2 filas con:
--   security_definer = true · anon_puede = false · authenticated_puede = false
--   service_role_puede = true
SELECT p.proname                                                  AS funcion,
       p.prosecdef                                                AS security_definer,
       has_function_privilege('anon',          p.oid, 'EXECUTE')  AS anon_puede,
       has_function_privilege('authenticated', p.oid, 'EXECUTE')  AS authenticated_puede,
       has_function_privilege('service_role',  p.oid, 'EXECUTE')  AS service_role_puede
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('consumir_uso_camara', 'consumir_consulta_guzzi');
