#!/bin/bash
MAX=${1:-300}
echo "[extract-emails-v17.2] $(date) - MAX=$MAX"

echo "[extract-emails] Fetching companies..."
docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -t -A -q -c "
  SELECT json_agg(row_to_json(t)) FROM (
    SELECT company, COUNT(*) as jobs
    FROM \"JobListing\"
    WHERE company IS NOT NULL AND company != ''
      AND lower(trim(company)) NOT IN ('empresa europea','empresa','company','ver en oferta','confidencial','confidential','n/a','na','sin especificar','no especificado','private','empresa confidencial','recruiter','recruitment','agency','ett','-','.')
      AND (\"contactEmail\" IS NULL OR \"contactEmail\" = '')
      AND \"isActive\" = true
    GROUP BY company ORDER BY jobs DESC LIMIT $MAX
  ) t
" > /root/.companies.json

node /root/extract-emails-worker.js 2>&1
