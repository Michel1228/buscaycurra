#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# BACKUP RÁPIDO BUSCAYCURRA — Diario automático
# ═══════════════════════════════════════════════════════════════
set -euo pipefail
BACKUP_DIR="/root/backups/buscaycurra-$(date +%Y%m%d_%H%M)"
mkdir -p "$BACKUP_DIR"

# 1. DB dump (rápido, ~10s)
docker exec buscaycurra-db pg_dump -U buscaycurra -d buscaycurra -Fc -f /tmp/bc.dump 2>/dev/null
docker cp buscaycurra-db:/tmp/bc.dump "$BACKUP_DIR/db.dump" 2>/dev/null

# 2. Config snapshot
cp /root/.openclaw/workspace/buscaycurra-unified/.env.local "$BACKUP_DIR/env.local"
cp /root/candados.sh "$BACKUP_DIR/candados.sh"
cp /root/watchdog-bc.sh "$BACKUP_DIR/watchdog-bc.sh"
cp /root/restore-bc.sh "$BACKUP_DIR/restore-bc.sh"
crontab -l > "$BACKUP_DIR/crontab.txt" 2>/dev/null

# 3. Limpiar backups viejos (>7 días)
find /root/backups -maxdepth 1 -type d -name "buscaycurra-*" -mtime +7 -exec rm -rf {} \; 2>/dev/null

echo "$(date): Backup OK — $(du -sh $BACKUP_DIR | cut -f1)"