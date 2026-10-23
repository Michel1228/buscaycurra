#!/usr/bin/env bash
# resumen-diario.sh — El correo de cada mañana para Michel: cuántas personas hay,
# cuántas entraron ayer y de dónde vienen. Va al móvil, sin encender el ordenador.
#
# Todos los días a las 07:40 UTC (9:40 en verano, 8:40 en invierno), diez
# minutos después del centinela, para contar también cómo le ha ido. La lógica
# está en /api/admin/resumen-diario.

set -uo pipefail

ENV=/root/.openclaw/workspace/buscaycurra-unified/.env.local
SECRET=$(grep -E '^ADMIN_SECRET=' "$ENV" | head -1 | cut -d= -f2- | tr -d '\r\042\047')

# "28 pasan, 4 fallan" del centinela de hoy; si hoy no ha corrido, no se pasa nada.
CENTINELA=$(grep "^$(date -u +%F) " /root/centinela.log 2>/dev/null | tail -1 | grep -oE '[0-9]+ pasan, [0-9]+ fallan')

RESPUESTA=$(curl -s --max-time 110 -w ' HTTP %{http_code}' -X POST -G \
  "http://localhost:8892/api/admin/resumen-diario" \
  --data-urlencode "centinela=$CENTINELA" \
  -H "x-sync-secret: $SECRET")

echo "$(date -u '+%Y-%m-%d %H:%M UTC')  $(echo "$RESPUESTA" | cut -c1-300)"
