#!/usr/bin/env bash
# sync-plazas-cursos.sh — Plazas reales de cursos gratis (Lanbide, SEF Murcia,
# SOC, Consorci de Formació Contínua, Navarra y ECyL de Castilla y León) a la
# tabla curso_plaza.
#
# Una vez al día. La lógica está en /api/cursos/plazas/sync: cada fuente por
# separado, y una que falle NO borra sus plazas de ayer. El centinela avisa si
# alguna lleva más de 3 días sin actualizarse.
# Para lanzarlo a mano con una sola fuente:
#   curl -s -X POST "http://localhost:8892/api/cursos/plazas/sync?fuente=lanbide" -H "x-sync-secret: $SECRET"

set -uo pipefail

ENV=/root/.openclaw/workspace/buscaycurra-unified/.env.local
SECRET=$(grep -E '^ADMIN_SECRET=' "$ENV" | head -1 | cut -d= -f2- | tr -d '\r\042\047')

RESPUESTA=$(curl -s --max-time 290 -w ' HTTP %{http_code}' -X POST \
  "http://localhost:8892/api/cursos/plazas/sync" \
  -H "x-sync-secret: $SECRET")

echo "$(date -u '+%Y-%m-%d %H:%M UTC')  $RESPUESTA"
