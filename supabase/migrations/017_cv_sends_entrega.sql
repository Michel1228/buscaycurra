-- 017_cv_sends_entrega.sql
--
-- Saber si el CV llegó de verdad.
--
-- EL AGUJERO. El estado 'enviado' significaba «se lo hemos dado a Resend», no
-- «ha llegado a la empresa». Nadie ponía nunca el estado 'fallido', porque no
-- había nada escuchando los rebotes: el webhook que existe solo registra
-- aperturas y respuestas.
--
-- Así que si el correo de una empresa estaba mal, o el buzón lleno, o nos
-- marcaban como spam, el usuario veía «enviado» y se quedaba tan tranquilo
-- esperando una respuesta que no iba a llegar nunca. Creía haber echado el CV a
-- veinte empresas y a lo mejor había llegado a catorce.
--
-- Para una función cuyo valor entero es «te mandamos el CV a las empresas», no
-- saber si llega es el fallo más grave posible.
--
-- Tampoco se guardaba el identificador que devuelve Resend, así que no había
-- forma de casar un rebote con su envío.

-- El identificador de Resend, para poder correlacionar los avisos de entrega.
ALTER TABLE cv_sends ADD COLUMN IF NOT EXISTS resend_id TEXT;

-- Cuándo confirmó Resend que el correo entró en el buzón de destino.
ALTER TABLE cv_sends ADD COLUMN IF NOT EXISTS entregado_en TIMESTAMPTZ;

-- Si rebotó: cuándo y por qué. El motivo importa, porque no es lo mismo un
-- buzón lleno (se puede reintentar) que una dirección que no existe (no).
ALTER TABLE cv_sends ADD COLUMN IF NOT EXISTS rebotado_en TIMESTAMPTZ;
ALTER TABLE cv_sends ADD COLUMN IF NOT EXISTS motivo_rebote TEXT;

CREATE INDEX IF NOT EXISTS idx_cv_sends_resend_id ON cv_sends (resend_id);

-- Los estados nuevos. 'entregado' es mejor noticia que 'enviado', y 'rebotado'
-- es la que faltaba: hasta ahora un rebote no tenía dónde apuntarse.
ALTER TABLE cv_sends DROP CONSTRAINT IF EXISTS cv_sends_status_check;
ALTER TABLE cv_sends ADD CONSTRAINT cv_sends_status_check
  CHECK (status IN (
    'pendiente', 'enviado', 'entregado', 'rebotado',
    'fallido', 'cancelado', 'visto', 'respondido'
  ));
