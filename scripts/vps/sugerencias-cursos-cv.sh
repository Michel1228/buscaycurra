#!/usr/bin/env bash
# sugerencias-cursos-cv.sh — A quien tiene CV, el curso que le falta para lo que
# ha trabajado, cuando hay plaza gratis cerca ("Veo en tu CV que has trabajado
# de camarera...").
#
# Cada 3 horas, a los 40 minutos (no coincide con el correo de ofertas, que va
# en punto). La logica esta en /api/cursos/sugerencias-cv: como mucho una
# sugerencia cada 14 dias por persona, 15 por pasada, y respetando el
# presupuesto diario de correo. Para ver que se mandaria sin mandar nada:
#   curl -s -X POST "http://localhost:8892/api/cursos/sugerencias-cv?simular=1" -H "x-sync-secret: $SECRET"

set -uo pipefail

ENV=/root/.openclaw/workspace/buscaycurra-unified/.env.local
SECRET=$(grep -E '^ADMIN_SECRET=' "$ENV" | head -1 | cut -d= -f2- | tr -d '\r\042\047')

RESPUESTA=$(curl -s --max-time 290 -w ' HTTP %{http_code}' -X POST \
  "http://localhost:8892/api/cursos/sugerencias-cv" \
  -H "x-sync-secret: $SECRET")

echo "$(date -u '+%Y-%m-%d %H:%M UTC')  $(echo "$RESPUESTA" | cut -c1-400)"
