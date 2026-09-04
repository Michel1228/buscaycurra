-- 005_consumir_cuota_atomico.sql — Que dos peticiones a la vez no cuelen dos.
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

CREATE OR REPLACE FUNCTION consumir_uso_camara(
  p_user_id  uuid,
  p_date_key text,
  p_limite   integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nuevo integer;
BEGIN
  INSERT INTO usage_tracking (user_id, date_key, week_key, camara_usos)
  VALUES (p_user_id, p_date_key, '', 1)
  ON CONFLICT (user_id, date_key) DO UPDATE
    SET camara_usos = usage_tracking.camara_usos + 1
    WHERE usage_tracking.camara_usos < p_limite
  RETURNING camara_usos INTO v_nuevo;

  -- Sin fila devuelta = el WHERE no se cumplió = ya no queda cuota.
  RETURN v_nuevo;
END;
$$;

-- Lo mismo para las consultas a Guzzi, que tienen la misma carrera.
CREATE OR REPLACE FUNCTION consumir_consulta_guzzi(
  p_user_id  uuid,
  p_date_key text,
  p_limite   integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nuevo integer;
BEGIN
  INSERT INTO usage_tracking (user_id, date_key, week_key, guzzi_consultas)
  VALUES (p_user_id, p_date_key, '', 1)
  ON CONFLICT (user_id, date_key) DO UPDATE
    SET guzzi_consultas = usage_tracking.guzzi_consultas + 1
    WHERE usage_tracking.guzzi_consultas < p_limite
  RETURNING guzzi_consultas INTO v_nuevo;

  RETURN v_nuevo;
END;
$$;
