#!/bin/bash
# El secreto estaba escrito en claro en el crontab, visible con un simple
# 'crontab -l'. Aqui se lee del .env.local, que esta en modo 600.
cd /root/.openclaw/workspace/buscaycurra-unified
S=$(grep -E '^ALERTS_SECRET=' .env.local | cut -d= -f2-)
curl -s --max-time 280 "https://buscaycurra.es/api/push/send-alerts" -H "Authorization: Bearer $S"
echo ""
