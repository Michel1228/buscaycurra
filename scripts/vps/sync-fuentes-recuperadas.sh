#!/bin/bash
# Fuentes que dependian de GitHub Actions y llevaban paradas desde el 5 jul 2026.
# Los workflows figuran "active" con su cron puesto, pero no se disparan desde
# entonces; se traen al cron del VPS, que es donde ya funcionan las otras cinco.
#
# El offset de The Muse se lleva AQUI a proposito: el endpoint lo guardaba en un
# fichero temporal dentro del contenedor, que se pierde en cada despliegue, asi
# que siempre reempezaba por la pagina 1 y reinsertaba las mismas 1.000 ofertas
# de un catalogo de mas de 400.000.
cd /root/.openclaw/workspace/buscaycurra-unified
SECRET=$(grep -E '^ADMIN_SECRET=' .env.local | cut -d= -f2-)
OFFSET_FILE=/root/.muse_offset
PAG=$(cat "$OFFSET_FILE" 2>/dev/null || echo 1)
[ "$PAG" -ge 20000 ] 2>/dev/null && PAG=1   # el catalogo tiene ~20.319 paginas

echo "=== $(date '+%F %T') — sync fuentes recuperadas (Muse desde pagina $PAG) ==="

curl -s --max-time 280 -X POST "https://buscaycurra.es/api/jobs/sync-global-free" \
  -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" \
  -d "{\"musePages\":50,\"museStartPage\":$PAG}" | head -c 400
echo ""
echo $((PAG + 50)) > "$OFFSET_FILE"

curl -s --max-time 280 -X POST "https://buscaycurra.es/api/jobs/sync-eu-apis" \
  -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{}' | head -c 400
echo ""
