#!/bin/bash
SECRET=$(grep -E '^ADMIN_SECRET=' /root/.openclaw/workspace/buscaycurra-unified/.env.local | head -1 | cut -d= -f2- | tr -d '[:cntrl:]')
BASE="http://localhost:8892/api/jobs/sync-usajobs"
T=0
for off in $(seq 0 10 600); do
  r=$(curl -s --max-time 60 -X POST "$BASE" -H "x-sync-secret: ${SECRET}" -H "Content-Type: application/json" -d "{\"batchSize\":25,\"offset\":${off}}")
  ins=$(echo "$r" | grep -oP '"inserted":\K\d+' || echo 0)
  T=$((T+ins))
  echo "$(date +%H:%M:%S) off=${off}: +${ins} (T:${T})"
done
echo "TOTAL=$T"
