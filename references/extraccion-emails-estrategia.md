# Estrategia de Extracción Masiva de Emails — BuscayCurra

> **Prioridad #1** (12 Jun 2026). 2.1M ofertas sin email = envíos de CV papel mojado.

## Estado actual (12 Jun 2026 21:30 UTC)

| Métrica | Valor |
|---------|-------|
| Total ofertas activas | 2,128,723 |
| Con email | **237,929 (11.18%)** |
| Sin email | 1,890,794 (88.82%) |
| Objetivo mínimo | ✅ 10% alcanzado |
| Próximo objetivo | 15% (~319K) |
| Siguiente objetivo | 20% (~426K) |

**Progreso**: +186,330 emails en 24h combinando Fase 3 (patrones conocidos para 44 empresas top) + Fase 4 (scraping 200 empresas en curso).

## Estrategia multi-fase

### ✅ Fase 1: Regex en descripciones (COMPLETADA)
Extraer emails del texto HTML/descripción de la oferta.
```sql
UPDATE "JobListing" SET "contactEmail" = 
  substring(description FROM '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
WHERE ("contactEmail" IS NULL OR "contactEmail" = '')
  AND description ~ '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}';
```
Resultado: ~6,600 ofertas (hecho 10 Jun 2026)

### ✅ Fase 2: Dominios en nombre de empresa (COMPLETADA)
Empresas tipo `domestiko.com`, `Cronoshare.com` → asignar email por patrón.
Resultado: ~22,700 ofertas (hecho 10 Jun 2026)

### 🔄 Fase 3: Patrones conocidos para top empresas (EN PROGRESO — 12 Jun 2026)
Mapeo directo empresa→email para staffing agencies y multinacionales con emails de RRHH públicos.

**Empresas mapeadas (17):**
- Randstad → rrhh@randstad.es / talent@randstad.com
- Manpower → seleccion@manpower.es / careers@manpowergroup.com
- Michael Page → info@michaelpage.es / apply@michaelpage.com
- Hays → madrid@hays.es / recruitment@hays.com
- Page Personnel → info@pagepersonnel.es
- Adecco → empleo@adecco.com
- Gi Group → info@gigroup.com
- Eurofirms → seleccion@eurofirms.com
- Synergie → empleo@synergie.es / recrutement@synergie.fr
- Start People → info@startpeople.es
- Temporis → rrhh@temporis.es
- Lidl → talent@lidl.es / jobs@lidl.com
- Domino's Pizza → jobs@dominos.es / careers@dominos.com
- Starbucks → jobs@starbucks.es / careers@starbucks.com
- Robert Half → madrid@roberthalf.es / apply@roberthalf.com
- NHS → nhsbsa.pensionsemployers@nhs.net
- Amazon → amazon-jobs@amazon.com
- Deloitte → careers@deloitte.es / careers@deloitte.com
- EY → careers@es.ey.com / careers@ey.com

### 🔜 Fase 4: Scraping de webs corporativas
Script: `scripts/extract-company-emails.ts`
- Toma top 500 empresas sin email
- DNS → MX/A record → descubre dominio
- HTTPS GET homepage → regex email
- Prioriza: rrhh@, empleo@, jobs@ sobre info@
- Batch de 25 empresas, 200ms pausa entre batches

### 🔜 Fase 5: Hunter.io API (requiere $34/mes)
- API profesional de búsqueda de patrones de email
- 500 búsquedas/mes = 500 dominios
- Revela patrón: `{nombre}.{apellido}@empresa.com`
- Verifica emails (SMTP check)
- Integrable vía `POST https://api.hunter.io/v2/domain-search?domain=X&api_key=Y`

### 🔜 Fase 6: Google Dorking + SMTP verify (gratis)
- Buscar `"@dominio.com"` en Google
- Extraer emails expuestos
- SMTP VRFY/RCPT TO para verificar sin enviar

### 🧹 Limpieza post-extracción
```sql
-- Eliminar falsos positivos
UPDATE "JobListing" SET "contactEmail" = NULL
WHERE "contactEmail" LIKE '%.png' OR "contactEmail" LIKE '%.jpg'
   OR "contactEmail" LIKE '%@2x%' OR "contactEmail" LIKE '%icon%'
   OR "contactEmail" LIKE '%logo%' OR "contactEmail" LIKE '%example%'
   OR "contactEmail" LIKE '%test%' OR "contactEmail" LIKE '%noreply%';
```

## Métricas de seguimiento
```sql
-- Total con email
SELECT COUNT(*) FROM "JobListing" WHERE "contactEmail" IS NOT NULL AND "contactEmail" != '';
-- Porcentaje
SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE "contactEmail" IS NOT NULL) / COUNT(*), 2) 
FROM "JobListing" WHERE "isActive" = true;
-- Top empresas aún sin email
SELECT company, COUNT(*) as n FROM "JobListing" 
WHERE ("contactEmail" IS NULL OR "contactEmail" = '') AND company IS NOT NULL
GROUP BY company ORDER BY n DESC LIMIT 20;
```

## Objetivo
**213K ofertas con email (10%)** → viable con Fases 3+4. Si se aprueba Hunter.io, apuntar al 20-30%.

---
Última actualización: 12 Jun 2026
