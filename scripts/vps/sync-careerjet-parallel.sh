#!/bin/bash
# sync-careerjet-parallel.sh — Sync masivo paralelo Careerjet 24 países
# 24 workers simultáneos, batchSize=5 cada uno
# Ronda completa en ~120 segundos
set -e
ADMIN_SECRET=$(grep -E '^ADMIN_SECRET=' /root/.openclaw/workspace/buscaycurra-unified/.env.local | head -1 | cut -d= -f2- | tr -d '[:cntrl:]')
BASE="http://localhost:8892/api/jobs/sync-careerjet-global"

countries="us uk au ca de fr nl it es se ch be pt ie no dk at fi nz pl gr cz hu ro jp sg"
total=0

for c in $countries; do
  curl -s --max-time 300 -X POST "$BASE" \
    -H "x-sync-secret: $ADMIN_SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"country\":\"$c\",\"batchSize\":5}" > /tmp/cj_$c.json 2>&1 &
done
wait

for c in $countries; do
  inserted=$(python3 -c "import json; d=json.load(open('/tmp/cj_$c.json')); print(d.get('inserted',0))" 2>/dev/null || echo 0)
  total=$((total + inserted))
  echo "  $c: $inserted"
done
echo "TOTAL: $total nuevas ofertas"
