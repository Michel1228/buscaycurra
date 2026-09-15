#!/bin/bash
SECRET=$(grep -E '^ADMIN_SECRET=' /root/.openclaw/workspace/buscaycurra-unified/.env.local | head -1 | cut -d= -f2- | tr -d '[:cntrl:]')
BASE="http://localhost:8892/api/jobs/sync-adzuna-global"
T=0
for p in us uk de fr au ca es it nl; do
  for page in $(seq 2 80); do
    r=$(curl -s --max-time 25 -X POST "$BASE" -H "x-sync-secret: ${SECRET}" -H "Content-Type: application/json" -d "{\"country\":\"${p}\",\"batchSize\":5,\"page\":${page}}")
    ins=$(echo "$r" | grep -oP '"inserted":\K\d+' || echo 0)
    T=$((T+ins))
    echo "$(date +%H:%M:%S) ${p} p${page}: +${ins} (T:${T})"
  done
done
echo "TOTAL=$T"
