#!/usr/bin/env bash
# avisos-carnes.sh — "Tu carne caduca en 3 meses / en 1 mes", a quien guardo su
# carne en Mis cursos con los avisos puestos.
#
# De lunes a viernes a las 08:30 y 09:30 UTC; la web solo avisa entre las 10:00
# y las 12:00 de Madrid (media manana, cuando mas se abre el correo), asi que
# sale a las 10:30 de Espana tanto en verano como en invierno. La logica esta en
# /api/cursos/carnes/avisos: dos avisos por carne como mucho, y el correo solo
# con CARNES_AVISO_CORREO=1 en el entorno del contenedor. Para ver que se
# mandaria sin mandar nada:
#   curl -s -X POST "http://localhost:8892/api/cursos/carnes/avisos?simular=1" -H "x-sync-secret: $SECRET"

set -uo pipefail

ENV=/root/.openclaw/workspace/buscaycurra-unified/.env.local
SECRET=$(grep -E '^ADMIN_SECRET=' "$ENV" | head -1 | cut -d= -f2- | tr -d '\r\042\047')

RESPUESTA=$(curl -s --max-time 110 -w ' HTTP %{http_code}' -X POST \
  "http://localhost:8892/api/cursos/carnes/avisos" \
  -H "x-sync-secret: $SECRET")

echo "$(date -u '+%Y-%m-%d %H:%M UTC')  $(echo "$RESPUESTA" | cut -c1-400)"
