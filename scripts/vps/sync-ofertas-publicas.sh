#!/usr/bin/env bash
# sync-ofertas-publicas.sh — Ofertas de los servicios públicos de empleo
# (Lanbide y SEF Murcia) a JobListing, desde sus datos abiertos.
#
# Dos veces al día: las ofertas públicas cierran plazo en pocos días. La lógica
# está en /api/jobs/sync-ofertas-publicas (lib/job-search/ofertas-publicas.ts):
# cada fuente por separado, y lo que una fuente deja de publicar solo se retira
# si esa fuente respondió entera. Para lanzar una sola:
#   curl -s -X POST "http://localhost:8892/api/jobs/sync-ofertas-publicas?fuente=lanbide" -H "x-sync-secret: $SECRET"

set -uo pipefail

ENV=/root/.openclaw/workspace/buscaycurra-unified/.env.local
SECRET=$(grep -E '^ADMIN_SECRET=' "$ENV" | head -1 | cut -d= -f2- | tr -d '\r\042\047')

RESPUESTA=$(curl -s --max-time 290 -w ' HTTP %{http_code}' -X POST \
  "http://localhost:8892/api/jobs/sync-ofertas-publicas" \
  -H "x-sync-secret: $SECRET")

echo "$(date -u '+%Y-%m-%d %H:%M UTC')  $RESPUESTA"
