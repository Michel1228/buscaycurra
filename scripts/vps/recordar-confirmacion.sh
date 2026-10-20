#!/usr/bin/env bash
# recordar-confirmacion.sh — "Te falta confirmar tu correo", a quien se registro
# y no lo confirmo. Una vez por persona, entre 1 y 30 dias despues del registro.
#
# De lunes a viernes a las 08:45 y 09:45 UTC; la web solo manda entre las 10:00 y
# las 12:00 de Madrid, asi que sale a las 10:45 de Espana en verano y en invierno
# (un cuarto de hora despues de los avisos de carnes). La logica esta en
# /api/auth/recordar-confirmacion. Para ver a cuantos se mandaria sin mandar nada:
#   curl -s -X POST "http://localhost:8892/api/auth/recordar-confirmacion?probar=1" -H "x-sync-secret: $SECRET"

set -uo pipefail

ENV=/root/.openclaw/workspace/buscaycurra-unified/.env.local
SECRET=$(grep -E '^ADMIN_SECRET=' "$ENV" | head -1 | cut -d= -f2- | tr -d '\r\042\047')

RESPUESTA=$(curl -s --max-time 110 -w ' HTTP %{http_code}' -X POST \
  "http://localhost:8892/api/auth/recordar-confirmacion" \
  -H "x-sync-secret: $SECRET")

echo "$(date -u '+%Y-%m-%d %H:%M UTC')  $(echo "$RESPUESTA" | cut -c1-400)"
