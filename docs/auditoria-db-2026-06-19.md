# 🗄️ Auditoría de Base de Datos — BuscayCurra (Update 2026-06-19)

**Fecha**: 2026-06-19  
**Alcance**: VPS PostgreSQL (Prisma ORM, container `buscaycurra-db`, puerto 5433) + análisis de código  
**Contexto**: Update de la auditoría del 2026-06-01. El VPS ahora es accesible directamente.

---

## 📊 1. RESUMEN EJECUTIVO

| Área | Estado | Hallazgo principal |
|------|--------|-------------------|
| Índices VPS | 🔴 **CRÍTICO** | Application y SavedJob: 6.5M seq scans combinados con 0 idx scans. Sin índices en columnas FK. |
| Bloat/Tamaño | 🔴 **CRÍTICO** | JobListing: 2.8 GB (2.4M filas, +140x desde junio). 9% bloat. user_cvs 72% dead tuples. job_alerts 82% dead tuples. |
| N+1 Queries | 🔴 **CRÍTICO** | 2 nuevas instancias sin corregir desde junio + N+1 por keyword en semantic-search |
| Connection Pooling | 🟡 **ACEPTABLE** | getPool() global (max:5). Pero varios endpoints crean su propio Pool con max:1. |
| Migraciones | 🟡 **ACEPTABLE** | Solo 1 migración Prisma aplicada (init). Schema manejado con push/sync. |
| Timestamps | 🔴 **ALTO** | 9 tablas sin updatedAt. JobListing (2.4M filas) solo tiene createdAt. |
| Foreign Keys | 🟡 **MEJORABLE** | Prisma tables tienen FKs. Tablas legacy (job_alerts, push_subscriptions, user_cvs, etc.) sin FKs. |

---

## 📋 2. TAMAÑOS DE TABLAS (VPS)

| Tabla | Tamaño total | Filas | Dead tuples | Bloat % | Último autovacuum | Seq Scan | Idx Scan |
|-------|-------------|-------|-------------|---------|-------------------|----------|----------|
| **JobListing** | **2.78 GB** | 2,399,503 | 239,137 | **9.0%** | 2026-06-15 | 164,371 | 236,874,186 |
| gusi_conversations | 2.9 MB | 300 | 0 | 0% | 2026-06-05 | 4 | 343 |
| user_cvs | 288 KB | 12 | 32 | **72.7%** 🔴 | 2026-06-05 | 2,112 | 463 |
| CV | 152 KB | 13 | 0 | 0% | 2026-06-05 | 29 | 1 |
| job_alerts | 96 KB | 5 | 24 | **82.8%** 🔴 | 2026-06-12 | 466 | 57 |
| User | 80 KB | 18 | 0 | 0% | 2026-06-05 | 25 | 36 |
| cv_sends | 80 KB | 51 | 0 | 0% | 2026-06-05 | 28 | 50 |
| saved_jobs | 80 KB | 29 | 0 | 0% | 2026-06-05 | 1,323 | 25,402 |
| push_subscriptions | 80 KB | 1 | 1 | **50.0%** 🟡 | 2026-06-05 | 62 | 86 |
| **Application** | 64 KB | 3 | 0 | 0% | 2026-06-05 | **3,267,814** 🔴 | **0** 🔴 |
| **SavedJob** | 16 KB | 0 | 0 | 0% | 2026-06-05 | **3,267,805** 🔴 | **0** 🔴 |
| ScheduledCampaign | 64 KB | 1 | 0 | 0% | 2026-06-05 | 14 | 0 |
| company_reviews | 40 KB | 0 | 0 | 0% | 2026-06-05 | 1 | 0 |
| referrals | 32 KB | 0 | 0 | 0% | 2026-06-05 | 1 | 0 |
| CampaignRun | 16 KB | 0 | 0 | 0% | 2026-06-05 | 2 | 0 |

### Análisis de crecimiento
- **JobListing pasó de ~17K filas (junio 1) a 2.4M filas (junio 19)** — crecimiento masivo de +14,000%
- El bulk-indexer insertó millones de ofertas pero dejó 239K dead tuples (9%)
- Los índices trigram (title, city, province) se crearon, pero la tabla creció demasiado rápido

---

## 🔍 3. ÍNDICES — ANÁLISIS DETALLADO

### 3.1 Índices existentes (42 índices en 18 tablas)

**JobListing** (11 índices) — ✅ Buena cobertura:
- `JobListing_new_pkey` — PK (236M scans, el más usado)
- `idx_joblisting_id` — UNIQUE BTREE en id
- `idx_joblisting_country` — BTREE WHERE country IS NOT NULL
- `idx_joblisting_title_trgm` — GIN trigram en title (¡solo 4 scans!)
- `idx_joblisting_city_trgm` — GIN trigram en city (17 scans)
- `idx_joblisting_city_unaccent_trgm` — GIN trigram en unaccent(city) (85 scans)
- `idx_joblisting_province_trgm` — GIN trigram en province (14 scans)
- `idx_joblisting_province_unaccent_trgm` — GIN trigram en unaccent(province) (85 scans)

### 3.2 🔴 CRÍTICO: ÍNDICES FALTANTES

**Application** — 3,267,814 seq scans, CERO idx scans:
```
❌ userId  — FK a User, 3.2M consultas sin índice
❌ cvId    — FK a CV, 3.2M consultas sin índice
❌ jobId   — FK a JobListing, 3.2M consultas sin índice
❌ campaignId — FK a ScheduledCampaign, sin índice
```

**SavedJob** — 3,267,805 seq scans, CERO idx scans:
```
❌ userId  — FK a User, 3.2M consultas sin índice
❌ jobId   — FK a JobListing, 3.2M consultas sin índice
```

**JobListing** — Faltan índices críticos para queries del código:
```
❌ isActive — WHERE "isActive" = true en TODAS las queries. 164K seq scans.
❌ createdAt — WHERE "createdAt" > $1 en alertas. Sin índice.
❌ scrapedAt — ORDER BY "scrapedAt" DESC en semantic-search.
❌ company — WHERE company = $1 en extract-company-emails.
❌ sourceName — GROUP BY en admin/stats.
❌ contactEmail — WHERE "contactEmail" IS NULL en extract-company-emails.
❌ LOWER(title) — Las queries usan LOWER(title) LIKE, no ILIKE. 
   El índice trigram (title gin_trgm_ops) no se usa porque la query usa LOWER().
```

### 3.3 Índices con uso sub-óptimo
- `idx_joblisting_title_trgm`: 4 scans en 19 días — prácticamente sin uso. Las queries usan `LOWER(title) LIKE` en vez de `ILIKE` o `title %`.
- `idx_joblisting_province_trgm`: 14 scans. El índice unaccent sí se usa (85 scans).
- `Application`: TODOS los índices tienen 0 scans porque no existen índices en las columnas que se consultan.

---

## 🐛 4. QUERIES N+1 DETECTADAS

### 4.1 🔴 `push/send-alerts/route.ts` (L138-226) — CRÍTICO (sin corregir)

```typescript
// L138: for sobre hasta 100 alertas
for (const alerta of alertasResult.rows) {
  // L171: query a JobListing por alerta → hasta 100 queries
  const jobsResult = await pool.query(`...FROM "JobListing"...`);
  
  // L194: query a push_subscriptions por alerta → hasta 100 queries
  const subsResult = await pool.query(`...FROM push_subscriptions...`);
  
  // L204: for sobre subs → push por cada uno
  for (const sub of subsResult.rows) { await sendPush(sub, {...}); }
  
  // L155 (en versión anterior): INSERT en Supabase por alerta
}
```
**Impacto**: Hasta 300+ round-trips a PostgreSQL por ejecución.  
**Solución**: Pre-cargar todas las suscripciones en una sola query. Acumular notificaciones.

### 4.2 🔴 `jobs/scrape-ats/route.ts` (L187-239) — CRÍTICO (NUEVO)

```typescript
// L187: for sobre hasta 200 alertas
for (const alerta of alertasRes.rows) {
  // L197: COUNT query por alerta → hasta 200 queries
  const countRes = await pool.query(`SELECT COUNT(*) FROM "JobListing"...`);
  
  // L207: query a push_subscriptions por alerta → hasta 200 queries
  const subsRes = await pool.query(`...FROM push_subscriptions...`);
  
  // L212: for sobre subs → push por cada uno
  for (const sub of subsRes.rows) { await sendPush(sub, {...}); }
  
  // L229: INSERT en Supabase por alerta
  await supabase.from("notificaciones").insert({...});
  
  // L239: UPDATE por alerta
  await pool.query(`UPDATE job_alerts SET last_sent_at = NOW() WHERE id = $1`, [alerta.id]);
}
```
**Impacto**: Hasta 600+ round-trips por ejecución (cada hora vía cron).  
**Solución**: Misma que send-alerts. Consolidar queries.

### 4.3 🟡 `jobs/semantic-search/route.ts` (L48-76) — MEDIO

```typescript
// L48: for hasta 6 keywords → 6 queries separadas
for (const kw of allKeywords.slice(0, 6)) {
  const res = await pool.query(`...FROM "JobListing" WHERE ... ILIKE $1...`, [pattern]);
}
```
**Impacto**: 6 round-trips por búsqueda en vez de 1 con UNION ALL o array de patrones.  
**Solución**: Usar `ANY($1)` con array de patrones, o concatenar con OR.

### 4.4 🟡 `extract-company-emails.ts` (L220-248) — Script offline, bajo impacto

Row-by-row UPDATE en vez de batch. No es crítico porque es un script offline.

---

## ⚡ 5. QUERIES INEFICIENTES

### 5.1 🔴 `LOWER()` en vez de `ILIKE` (JobListing queries)
```sql
-- Código actual (send-alerts, scrape-ats, semantic-search):
WHERE LOWER(title) LIKE $1 OR LOWER(company) LIKE $1 OR LOWER(description) LIKE $1

-- Esto NO usa los índices trigram (title gin_trgm_ops) porque LOWER()
-- cambia el operador. Debería ser:
WHERE title ILIKE $1 OR company ILIKE $1 OR description ILIKE $1
-- o para trigram:
WHERE title % $1
```

### 5.2 🟡 `ORDER BY "scrapedAt" DESC` sin índice — medium impact
A 2.4M filas, ordenar por scrapedAt requiere un sort completo. Se necesita:
```sql
CREATE INDEX idx_joblisting_scrapedat ON "JobListing" ("scrapedAt" DESC);
```

### 5.3 🟡 `isActive` filtrado en todas las queries sin índice parcial
```sql
-- Presente en TODAS las queries a JobListing
WHERE "isActive" = true
-- Sin índice parcial. A 2.4M filas esto fuerza seq scan.
```

---

## 🔌 6. CONEXIONES Y POOLING

### Configuración
- **max_connections**: 100
- **Conexiones activas**: 3 (uso muy bajo, 3%)
- **getPool()**: Pool global con `max: 5`, `idleTimeoutMillis: 30000`
- **Problema**: La contraseña está **hardcodeada** en `lib/db.ts` L13

### Inconsistencias de pooling
| Endpoint/Script | Pool | Problema |
|----------------|------|----------|
| `lib/db.ts` → getPool() | max: 5, global | Puerto **5432** (correcto dentro de Docker network) |
| `paises/stats` | new Pool(max:1) cada request | Crea y destruye pool en cada llamada |
| `gusi/analyze-image` | new Pool(max:1) cada request | Ídem |
| `extract-company-emails.ts` | new Pool(max:3) | Puerto **5433** (host mapping), inconsistente |
| `extract-company-emails.js` | new Pool(max:5) | Puerto **5432**, duplicado con .ts |

**Recomendación**: Usar `getPool()` en todos los endpoints. Eliminar Pools locales.

---

## 🧭 7. MIGRACIONES

### Estado
- **1 migración aplicada**: `20260410163939_init` (2026-04-10)
- Sin migraciones posteriores → el schema evoluciona sin tracking
- Probablemente se usa `prisma db push` sin generar migraciones

### Riesgo
- Imposible hacer rollback
- Sin historial de cambios de schema
- Sin control de versiones del schema en producción

---

## ⏱️ 8. TIMESTAMPS — ANÁLISIS

### ✅ Tablas CON createdAt + updatedAt
- `CV`, `ScheduledCampaign`, `User`, `gusi_conversations`, `user_cvs`

### 🔴 Tablas con SOLO createdAt (sin updatedAt)
| Tabla | Filas | Riesgo |
|-------|-------|--------|
| **JobListing** | 2.4M | 🔴 Sin tracking de última modificación |
| **Application** | 3 | 🟡 Tabla de tracking de envíos |
| company_reviews | 0 | 🟢 Vacía |
| cv_cartas | 0 | 🟢 Vacía |
| **cv_sends** | 51 | 🟡 Tiene `sent_at` pero no `updated_at` |
| **job_alerts** | 5 | 🟡 Tiene `last_sent_at` pero no `updated_at` |
| push_subscriptions | 1 | 🟡 |
| referrals | 0 | 🟢 Vacía |
| **saved_jobs** | 29 | 🟡 |

### 🔴 Tablas SIN timestamps
- `user_contacts`: solo tiene `updated_at`, sin `created_at`
- `CampaignRun`: ni createdAt ni updatedAt

---

## 🔗 9. FOREIGN KEYS

### ✅ FKs definidas (Prisma)
```
Application → User (RESTRICT), CV (RESTRICT), JobListing (SET NULL), ScheduledCampaign (SET NULL)
CV → User (RESTRICT)
SavedJob → User (RESTRICT), JobListing (RESTRICT)
ScheduledCampaign → CV (RESTRICT), User (RESTRICT)
CampaignRun → ScheduledCampaign (CASCADE)
```

### 🔴 Sin FKs (tablas legacy fuera de Prisma)
```
job_alerts.user_id         → sin FK a User
push_subscriptions.user_id → sin FK a User
user_cvs.user_id           → sin FK a User
cv_sends.user_id           → sin FK a User
cv_cartas.user_id          → sin FK a User
company_reviews.user_id    → sin FK a User
referrals.referrer_id      → sin FK a User
referrals.referred_id      → sin FK a User
saved_jobs.user_id         → sin FK a User (uuid, no text)
saved_jobs.job_id          → sin FK a JobListing
user_contacts.user_id      → sin FK a User (uuid, no text)
gusi_conversations.user_id → sin FK a User
```

### ⚠️ Inconsistencia de tipos
- `saved_jobs.user_id` es `uuid` pero `User.id` es `text`
- `company_reviews.user_id` es `uuid` pero `User.id` es `text`
- `job_alerts.user_id` es `uuid` pero `User.id` es `text`
- Esto impide crear FKs incluso si se quisiera

---

## 🎯 10. PRIORIDADES Y RECOMENDACIONES

### 🔴 CRÍTICAS (corregir esta semana)

1. **Crear índices en Application y SavedJob** — 6.5M seq scans diarios:
```sql
CREATE INDEX idx_application_userid ON "Application" ("userId");
CREATE INDEX idx_application_jobid ON "Application" ("jobId");
CREATE INDEX idx_application_cvid ON "Application" ("cvId");
CREATE INDEX idx_application_campaignid ON "Application" ("campaignId");
-- SavedJob ya tiene compuesto (user_id, job_id) — verificar si es suficiente
```

2. **Crear índices en JobListing para queries reales**:
```sql
CREATE INDEX idx_joblisting_isactive ON "JobListing" ("isActive") WHERE "isActive" = true;
CREATE INDEX idx_joblisting_createdat ON "JobListing" ("createdAt");
CREATE INDEX idx_joblisting_scrapedat ON "JobListing" ("scrapedAt" DESC);
CREATE INDEX idx_joblisting_company ON "JobListing" (LOWER(company));
CREATE INDEX idx_joblisting_source ON "JobListing" ("sourceName");
CREATE INDEX idx_joblisting_contactemail ON "JobListing" ("contactEmail") WHERE "contactEmail" IS NULL;
CREATE INDEX idx_joblisting_title_lower ON "JobListing" (LOWER(title));
```

3. **Arreglar N+1 en send-alerts y scrape-ats** — Consolidar queries.

4. **Ejecutar VACUUM FULL en user_cvs (72% bloat), job_alerts (82% bloat)**:
```sql
VACUUM FULL user_cvs;
VACUUM FULL job_alerts;
VACUUM FULL push_subscriptions;
-- Para JobListing (2.8GB, 9% bloat), programar en mantenimiento:
-- VACUUM FULL "JobListing"; -- ¡bloqueará la tabla por varios minutos!
```

5. **Cambiar LOWER() por ILIKE** en queries de búsqueda para usar índices trigram.

### 🟡 ALTAS (corregir este mes)

6. **Unificar connection pooling** — usar solo `getPool()` en todos los endpoints.
7. **Eliminar password hardcodeada** de `lib/db.ts` L13.
8. **Añadir FKs** a tablas legacy donde los tipos sean compatibles.
9. **Añadir `updatedAt`** a JobListing, Application, cv_sends, job_alerts, saved_jobs.
10. **Normalizar tipos de user_id** — unificar uuid vs text.
11. **Ejecutar VACUUM ANALYZE** en JobListing tras crear índices.

### 🟢 BAJAS (mejora continua)

12. **Generar migraciones Prisma** en vez de `db push`.
13. **Unificar sistema de referidos** — eliminar tabla `referidos` de Supabase (duplicada con `referrals`).
14. **Consolidar N+1 en semantic-search** con UNION ALL o array de patrones.
15. **Añadir `created_at`** a `user_contacts` y `CampaignRun`.

---

## 📝 11. MIGRACIONES SQL RECOMENDADAS

### Índices Application y SavedJob (APROX. 1ms cada uno — tablas casi vacías)
```sql
CREATE INDEX CONCURRENTLY idx_application_userid ON "Application" ("userId");
CREATE INDEX CONCURRENTLY idx_application_jobid ON "Application" ("jobId");
CREATE INDEX CONCURRENTLY idx_application_cvid ON "Application" ("cvId");
CREATE INDEX CONCURRENTLY idx_application_campaignid ON "Application" ("campaignId");
```

### Índices JobListing (¡CUIDADO! 2.8GB — crear con CONCURRENTLY en horas valle)
```sql
CREATE INDEX CONCURRENTLY idx_joblisting_isactive ON "JobListing" ("isActive") WHERE "isActive" = true;
CREATE INDEX CONCURRENTLY idx_joblisting_createdat ON "JobListing" ("createdAt");
CREATE INDEX CONCURRENTLY idx_joblisting_scrapedat ON "JobListing" ("scrapedAt" DESC);
CREATE INDEX CONCURRENTLY idx_joblisting_company_lower ON "JobListing" (LOWER(company));
CREATE INDEX CONCURRENTLY idx_joblisting_sourcename ON "JobListing" ("sourceName");
```

### VACUUM
```sql
VACUUM FULL user_cvs;        -- 288KB, instantáneo
VACUUM FULL job_alerts;      -- 96KB, instantáneo
VACUUM FULL push_subscriptions; -- 80KB, instantáneo
-- VACUUM FULL "JobListing" requiere ventana de mantenimiento (bloquea ~5-10 min)
```

---

*Informe generado automáticamente por Hermes Agent. Revisar antes de aplicar en producción.*
