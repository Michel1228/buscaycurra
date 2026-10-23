#!/usr/bin/env bash
# bienvenidas-antiguas.sh — La bienvenida (correo y aviso de ofertas) a las
# cuentas confirmadas de hace más de una semana que nunca la recibieron.
#
# De lunes a viernes a las 09:15 UTC: 11:15 de España en verano y 10:15 en
# invierno, dentro de las 10-12 de Madrid en las que avisa la web. Como mucho 25
# por mañana y sin comerse el cupo de correos; cuando no quede ninguna, no hace
# nada. La lógica está en /api/auth/bienvenidas-pendientes?antiguas=1. Para ver
# cuántas quedan sin mandar nada:
#   curl -s -X POST "http://localhost:8892/api/auth/bienvenidas-pendientes?antiguas=1&probar=1" -H "x-sync-secret: $SECRET"

set -uo pipefail

ENV=/root/.openclaw/workspace/buscaycurra-unified/.env.local
SECRET=$(grep -E '^ADMIN_SECRET=' "$ENV" | head -1 | cut -d= -f2- | tr -d '\r\042\047')

RESPUESTA=$(curl -s --max-time 110 -w ' HTTP %{http_code}' -X POST \
  "http://localhost:8892/api/auth/bienvenidas-pendientes?antiguas=1" \
  -H "x-sync-secret: $SECRET")

echo "$(date -u '+%Y-%m-%d %H:%M UTC')  $(echo "$RESPUESTA" | cut -c1-400)"
