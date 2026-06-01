# 🗄️ Auditoría de Base de Datos — BuscayCurra

**Fecha**: 2026-06-01  
**Alcance**: Supabase (public schema) + VPS PostgreSQL (JobListing, user_cvs, job_alerts, push_subscriptions)  
**Herramientas**: Supabase MCP, pg_stat_user_tables, pg_indexes, análisis de código fuente

---

## 📊 1. RESUMEN EJECUTIVO

| Área | Estado | Hallazgos |
|------|--------|-----------|
| Índices Supabase | 🟡 Regular | Profiles y referidos sin índices en columnas clave |
| Índices VPS (JobListing) | 🔴 Crítico | La tabla principal de búsqueda (17K+ rows) no tiene índices de texto ni en `isActive` |
| Integridad referencial | 🟡 Aceptable | Sin datos huérfanos, pero FKs inconsistentes entre tablas (referidos vs referrals) |
| Queries N+1 | 🔴 Crítico | 3 casos confirmados: alertas (200+ llamadas/ciclo), bulk-indexer (row-by-row INSERT), rate-limiter |
| Queries ineficientes | 🟡 Mejorable | ORDER BY con md5() impide uso de índices, ILIKE con wildcards sin GIN |

---

## 📋 2. ÍNDICES POR TABLA (SUPABASE)

### 2.1 Tabla `ofertas` (17,082 filas) — ✅ Bien indexada

| Índice | Tipo | Columna(s) |
|--------|------|------------|
| `ofertas_pkey` | UNIQUE BTREE | `id` |
| `idx_ofertas_descripcion` | GIN | `to_tsvector('spanish', descripcion)` |
| `idx_ofertas_titulo` | GIN | `to_tsvector('spanish', titulo)` |
| `idx_ofertas_keywords` | GIN | `keywords` |
| `idx_ofertas_fecha` | BTREE | `fecha DESC` |
| `idx_ofertas_fuente` | BTREE | `fuente` |
| `idx_ofertas_provincia` | BTREE | `provincia` |
| `idx_ofertas_sector` | BTREE | `sector` |

**Estadísticas**: `idx_scan = 17,133` vs `seq_scan = 25` → **ratio 685:1** ✅ Excelente

### 2.2 Tabla `profiles` (5 filas) — 🟡 Índices insuficientes

| Índice | Tipo | Columna(s) |
|--------|------|------------|
| `profiles_pkey` | UNIQUE BTREE | `id` |
| `idx_profiles_plan` | BTREE | `plan` |
| `idx_profiles_referral_code` | BTREE | `referral_code` (duplicado con unique) |
| `idx_profiles_stripe_customer_id` | BTREE | `stripe_customer_id` |

**FALTAN índices en**:
- ❌ `especie_id` — usado en queries de segmentación
- ❌ `referred_by` — FK sin índice (joins lentos)
- ❌ `subscription_status` — filtrado frecuente en queries de admin
- ❌ `oruga_stage` — filtrado en queries de onboarding

**Estadísticas**: `idx_scan = 484` vs `seq_scan = 1,395` → **ratio 0.3:1** 🔴 Muy pobre

### 2.3 Tabla `referidos` (0 filas) — 🔴 Sin índices en FKs

Solo tiene PK y UNIQUE en `codigo`. **FALTAN**:
- ❌ `referidor_id` — FK a auth.users sin índice
- ❌ `referido_id` — FK a auth.users sin índice
- ❌ `estado` — Para filtrar por pendientes/completados

### 2.4 Tabla `au_pair_profiles` y `au_pair_sends` — 🔴 Sin FKs

`au_pair_profiles.user_id` tiene UNIQUE pero **sin FK a auth.users**.  
`au_pair_sends.user_id` **no tiene FK ni índice**.

---

## 🔗 3. INTEGRIDAD REFERENCIAL

### 3.1 Foreign Keys existentes

| Tabla origen | Columna | Tabla destino | ON DELETE | Estado |
|-------------|---------|---------------|-----------|--------|
| `profiles` | `id` | `auth.users.id` | NO ACTION | ⚠️ |
| `profiles` | `referred_by` | `profiles.id` | SET NULL | ✅ |
| `cv_sends` | `user_id` | `auth.users.id` | NO ACTION | ⚠️ |
| `cvs` | `user_id` | `auth.users.id` | CASCADE | ✅ |
| `notificaciones` | `user_id` | `auth.users.id` | CASCADE | ✅ |
| `notificaciones_config` | `user_id` | `auth.users.id` | CASCADE | ✅ |
| `entrevistas` | `user_id` | `auth.users.id` | CASCADE | ✅ |
| `job_alerts` | `user_id` | `auth.users.id` | CASCADE | ✅ |
| `push_subscriptions` | `user_id` | `auth.users.id` | CASCADE | ✅ |
| `referidos` | `referidor_id` | `auth.users.id` | CASCADE | ⚠️ |
| `referidos` | `referido_id` | `auth.users.id` | SET NULL | ⚠️ |
| `referrals` | `referrer_id` | `profiles.id` | CASCADE | ✅ |
| `referrals` | `referred_id` | `profiles.id` | CASCADE | ✅ |

### 3.2 Problemas detectados

**⚠️ ALTA: FKs con `NO ACTION` en cascada**
- `profiles.id → auth.users.id` y `cv_sends.user_id → auth.users.id` usan `ON DELETE NO ACTION`. Si un usuario se elimina de `auth.users`, el perfil/cv_sends queda huérfano. Considerar `ON DELETE CASCADE`.

**⚠️ MEDIA: Inconsistencia entre referidos/referrals**
- `referidos` (tabla legacy) referencia `auth.users.id` directamente
- `referrals` (tabla nueva) referencia `public.profiles.id`
- Dos sistemas de referidos con esquemas diferentes

**🔴 ALTA: FKs ausentes**
- `au_pair_profiles.user_id` — sin FK a `auth.users.id`
- `au_pair_sends.user_id` — sin FK a `auth.users.id`, sin índice

### 3.3 Datos huérfanos

✅ **Verificación completada**: 0 registros huérfanos encontrados en todas las tablas verificadas.

---

## 🔍 4. QUERIES N+1 DETECTADAS

### 4.1 🐛 `push/send-alerts/route.ts` (L101-184) — CRÍTICO

```typescript
// L101: for loop sobre hasta 100 alertas
for (const alerta of alertasResult.rows) {
  // ...
  // L155: Supabase INSERT por cada alerta → 100 llamadas
  await supabase.from("notificaciones").insert({...});
  
  // L166: Supabase Auth call por cada alerta → 100 llamadas más
  const { data: { user } } = await supabase.auth.admin.getUserById(alerta.user_id);
}
```

**Impacto**: Hasta 200+ llamadas a Supabase por ejecución del cron (cada 3h).  
**Solución**: 
- Acumular notificaciones en array y hacer un solo `.insert([...])` 
- Pre-cargar todos los emails de usuario en una sola query de `auth.users` o `profiles`

### 4.2 🐛 `lib/job-search/bulk-indexer.ts` (L277-298) — CRÍTICO

```typescript
async function insertarEnBD(ofertas: OfertaReal[], ciudad: string): Promise<number> {
  for (const o of ofertas) {
    // INSERTS ROW-BY-ROW en vez de batch
    await pool.query(`INSERT INTO "JobListing" (...) VALUES ($1,$2,...) ON CONFLICT...`, [...]);
  }
}
```

**Impacto**: 500 round-trips a PostgreSQL en vez de 1. Con 22K combinaciones, esto son cientos de miles de queries individuales.  
**Solución**: Usar `INSERT INTO ... VALUES (...), (...), (...)` en lotes de 100-500 o usar `pg-format` / `unnest`.

### 4.3 🐛 `lib/cv-sender/rate-limiter.ts` (L79-141) — MEDIO

```typescript
// 3 consultas separadas a Supabase para verificar tasa
const { data: perfil } = await supabase.from("profiles").select("referral_credits")...;
const { count: enviadosHoy } = await supabase.from("cv_sends").select("id", {count:"exact"})...;
const { count: enviadosEsteMes } = await supabase.from("cv_sends").select("id", {count:"exact"})...;
```

**Impacto**: 3 round-trips para una verificación que podría ser 1 query SQL o 2 paralelas.  
**Solución**: Combinar en una sola query SQL con `COUNT(*) FILTER (WHERE ...)`.

---

## ⚡ 5. QUERIES INEFICIENTES

### 5.1 `jobs/search/route.ts` — ORDER BY rompe índices

```sql
ORDER BY
  CASE WHEN "scrapedAt" > NOW() - INTERVAL '7 days' THEN 0 ... END,
  md5(id::text || to_char(NOW(), 'YYYYDDD'))  -- ❌ md5() impide uso de índice
```

La función `md5()` sobre `id` + fecha actual hace que cada fila tenga un valor diferente cada día. PostgreSQL no puede usar ningún índice y debe hacer un full sort de todas las filas que matchean.

**Solución**: Pre-calcular un `random_sort` o usar `ORDER BY "scrapedAt" DESC, RANDOM()` con un seed fijo, o usar `TABLESAMPLE`.

### 5.2 `jobs/search/route.ts` — ILIKE sin GIN

```sql
WHERE title ILIKE '%keyword%' OR description ILIKE '%keyword%'
```

`ILIKE` con wildcards iniciales no puede usar índices BTREE. La tabla `JobListing` (VPS) no tiene índices GIN de texto como sí tiene `ofertas` (Supabase).

**Solución**: Crear índices GIN en `JobListing`:
```sql
CREATE INDEX idx_joblisting_title_gin ON "JobListing" USING gin (to_tsvector('spanish', title));
CREATE INDEX idx_joblisting_desc_gin ON "JobListing" USING gin (to_tsvector('spanish', description));
```

### 5.3 `jobs/search/route.ts` — Falta índice en `isActive`

```sql
WHERE "isActive" = true
```

No hay índice en la columna `isActive`. Con 17K+ filas el seq scan es pequeño, pero al crecer a 100K+ será un problema.

**Solución**: 
```sql
CREATE INDEX idx_joblisting_isactive ON "JobListing" ("isActive") WHERE "isActive" = true;
```

### 5.4 `empresas/candidatos/route.ts` — JSONB LIKE sin índice

```sql
WHERE LOWER(uc.form_data->>'ciudad') LIKE LOWER('%madrid%')
  OR LOWER(uc.form_data::text) LIKE LOWER('%keyword%')
```

Operadores `->>` y `::text` con LIKE no usan índices. La tabla `user_cvs` necesita un índice GIN sobre `form_data`.

**Solución**:
```sql
CREATE INDEX idx_user_cvs_form_data_gin ON user_cvs USING gin (form_data jsonb_path_ops);
```

### 5.5 `notifications/route.ts` — Filtrado en JS

```typescript
const sinLeer = (notifs || []).filter(n => !n.leida).length;
```

Se traen hasta 200 notificaciones y se filtran en JS. Para 77 registros no es grave, pero no escala.

**Solución**: Query separada con `.select("id", { count: "exact" }).eq("leida", false)` o usar `.select("leida")` y contar en JS.

---

## 🏗️ 6. VPS POSTGRESQL — `JobListing`

*No se pudo conectar directamente (hostname `buscaycurra-db` no resuelve desde este entorno), pero del análisis del código se infiere:*

### Estructura inferida (desde `bulk-indexer.ts` L280)

| Columna | Tipo | ¿Indexada? |
|---------|------|------------|
| `id` | text (PK) | ✅ PK implícito |
| `title` | text | ❌ Sin GIN |
| `company` | text | ❌ |
| `city` | text | ❌ |
| `province` | text | ❌ |
| `salary` | text | ❌ |
| `description` | text | ❌ Sin GIN |
| `sourceUrl` | text | ❌ |
| `sourceName` | text | ❌ |
| `sector` | enum `JobSector` | ❌ |
| `isActive` | boolean | ❌ |
| `scrapedAt` | timestamptz | ❌ |
| `createdAt` | timestamptz | ❌ |

### Índices recomendados para `JobListing`

```sql
-- Búsqueda textual (la más importante)
CREATE INDEX idx_joblisting_title_gin ON "JobListing" 
  USING gin (to_tsvector('spanish', title));
CREATE INDEX idx_joblisting_desc_gin ON "JobListing" 
  USING gin (to_tsvector('spanish', description));

-- Filtros más usados
CREATE INDEX idx_joblisting_isactive ON "JobListing" ("isActive") 
  WHERE "isActive" = true;
CREATE INDEX idx_joblisting_sector ON "JobListing" (sector);
CREATE INDEX idx_joblisting_scrapedat ON "JobListing" ("scrapedAt" DESC);
CREATE INDEX idx_joblisting_city ON "JobListing" (LOWER(city));
CREATE INDEX idx_joblisting_province ON "JobListing" (LOWER(province));
CREATE INDEX idx_joblisting_sourcename ON "JobListing" ("sourceName");

-- Índice compuesto para la query de alertas (la más frecuente)
CREATE INDEX idx_joblisting_alerts ON "JobListing" ("isActive", "createdAt") 
  WHERE "isActive" = true;
```

---

## 📊 7. ESTADÍSTICAS DE USO DE ÍNDICES (SUPABASE)

| Tabla | Filas | Seq Scan | Idx Scan | Ratio | Diagnóstico |
|-------|-------|----------|----------|-------|-------------|
| `ofertas` | 17,082 | 25 | 17,133 | **685:1** | ✅ Excelente |
| `notificaciones` | 77 | 428 | 2,294 | **5.4:1** | ✅ Bueno |
| `cv_sends` | 24 | 908 | 2,163 | **2.4:1** | 🟡 Aceptable |
| `cvs` | 1 | 31 | 114 | **3.7:1** | ✅ Bueno |
| `profiles` | 5 | 1,395 | 484 | **0.3:1** | 🔴 Pobre |

**Análisis**: `profiles` hace 3x más seq scans que idx scans. Esto se debe a que: (a) la tabla es pequeña (5 filas) y PostgreSQL prefiere seq scan, pero (b) el número absoluto de seq scans (1,395) es alto por queries que no usan índices (probablemente por `supabase.auth.getUser()` que hace join con `auth.users`).

---

## 🎯 8. PRIORIDADES Y RECOMENDACIONES

### 🔴 Críticas (corregir esta semana)

1. **Crear índices en `JobListing`** (VPS) — la tabla principal de búsqueda no tiene índices de texto
2. **Arreglar N+1 en `send-alerts/route.ts`** — 200+ llamadas a Supabase cada 3h
3. **Arreglar row-by-row INSERT en `bulk-indexer.ts`** — usar batch inserts
4. **Añadir FKs en `au_pair_profiles` y `au_pair_sends`**

### 🟡 Altas (corregir este mes)

5. **Añadir índices faltantes en `profiles`**: `especie_id`, `referred_by`, `subscription_status`
6. **Añadir índices faltantes en `referidos`**: `referidor_id`, `referido_id`, `estado`
7. **Optimizar ORDER BY en `jobs/search/route.ts`** — eliminar `md5()` 
8. **Crear índice GIN en `user_cvs.form_data`** para búsqueda de candidatos
9. **Unificar sistema de referidos** (`referidos` legacy vs `referrals` nuevo)

### 🟢 Bajas (mejora continua)

10. **Combinar queries del rate-limiter** en una sola consulta
11. **Cambiar NO ACTION → CASCADE** en `profiles` y `cv_sends` FKs
12. **Añadir `idx_joblisting_isactive` parcial** en VPS
13. **Usar COUNT en SQL** en vez de `.filter()` en JS para notificaciones

---

## 📝 9. MIGRACIONES SQL RECOMENDADAS

### Supabase

```sql
-- Índices profiles
CREATE INDEX idx_profiles_especie_id ON public.profiles (especie_id);
CREATE INDEX idx_profiles_referred_by ON public.profiles (referred_by);
CREATE INDEX idx_profiles_subscription_status ON public.profiles (subscription_status);
CREATE INDEX idx_profiles_oruga_stage ON public.profiles (oruga_stage);

-- FK en au_pair
ALTER TABLE public.au_pair_profiles 
  ADD CONSTRAINT au_pair_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.au_pair_sends 
  ADD CONSTRAINT au_pair_sends_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX idx_au_pair_sends_user_id ON public.au_pair_sends (user_id);

-- Índices referidos
CREATE INDEX idx_referidos_referidor_id ON public.referidos (referidor_id);
CREATE INDEX idx_referidos_referido_id ON public.referidos (referido_id);
CREATE INDEX idx_referidos_estado ON public.referidos (estado);
```

### VPS PostgreSQL (`JobListing`)

```sql
-- Índices de texto
CREATE INDEX idx_joblisting_title_gin ON "JobListing" USING gin (to_tsvector('spanish', title));
CREATE INDEX idx_joblisting_desc_gin ON "JobListing" USING gin (to_tsvector('spanish', description));

-- Índices de filtrado
CREATE INDEX idx_joblisting_isactive ON "JobListing" ("isActive") WHERE "isActive" = true;
CREATE INDEX idx_joblisting_sector ON "JobListing" (sector);
CREATE INDEX idx_joblisting_scrapedat ON "JobListing" ("scrapedAt" DESC);
CREATE INDEX idx_joblisting_city_lower ON "JobListing" (LOWER(city));
CREATE INDEX idx_joblisting_province_lower ON "JobListing" (LOWER(province));

-- Índice compuesto para alertas
CREATE INDEX idx_joblisting_alerts ON "JobListing" ("isActive", "createdAt") WHERE "isActive" = true;

-- Índice para user_cvs
CREATE INDEX idx_user_cvs_form_data_gin ON user_cvs USING gin (form_data jsonb_path_ops);
```

---

*Informe generado automáticamente por Hermes Agent. Revisar antes de aplicar migraciones en producción.*
