#!/bin/bash
# sync-eures-loop.sh — Barrido completo EURES (nueva API, julio 2026)
# Usa startIdx (0-23), batchSize=8 (máx), pagesPorKeyword=10 (máx)
# 24 keywords × 10 pages × 50 results = 12,000 por barrido completo
SECRET=$(grep -E '^ADMIN_SECRET=' /root/.openclaw/workspace/buscaycurra-unified/.env.local | head -1 | cut -d= -f2- | tr -d '[:cntrl:]')
BASE="http://localhost:8892/api/jobs/sync-eures"
T=0
for start in 0 8 16; do
  r=$(curl -s --max-time 300 -X POST "$BASE" \
    -H "x-sync-secret: ${SECRET}" \
    -H "Content-Type: application/json" \
    -d "{\"startIdx\":${start},\"batchSize\":8,\"pagesPorKeyword\":10}")
  ins=$(echo "$r" | grep -oP '"inserted":\K\d+' || echo 0)
  T=$((T+ins))
  echo "$(date +%H:%M:%S) EURES startIdx=${start}: +${ins} (T:${T})"
done
echo "TOTAL EURES: ${T}"
