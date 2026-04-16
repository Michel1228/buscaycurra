# BuscayCurra 🎯

App de búsqueda de empleo y mejora de CV con IA  
🌐 https://buscaycurra.es/app

---

## Sistema de Envío Automático de CVs

BuscayCurra incluye un sistema escalable de envío automático de CVs construido con **BullMQ + Redis**. Este sistema puede gestionar desde cientos hasta millones de usuarios en toda España sin depender de herramientas externas como n8n.

### ¿Cómo funciona?

```
Usuario configura → BullMQ añade job → Redis gestiona cola → Workers procesan → CV enviado
```

1. El usuario introduce el email de RRHH de la empresa y el puesto al que aplica
2. BullMQ añade el envío a la cola de Redis
3. El sistema calcula el próximo horario laboral disponible (lun-vie 9:00-18:00)
4. OpenClaw IA personaliza la carta de presentación para esa empresa
5. El worker envía el CV por email usando Resend
6. El usuario recibe una confirmación por email

### Cómo arrancar Redis con Docker

Asegúrate de tener Docker Desktop instalado. Luego ejecuta:

```bash
# Arrancar Redis en segundo plano
docker-compose up -d redis

# Ver que está corriendo
docker-compose ps

# Ver los logs de Redis
docker-compose logs redis

# Parar Redis
docker-compose stop redis
```

Redis quedará disponible en `redis://localhost:6379`.

### Cómo arrancar el Worker

El worker es el proceso que coge trabajos de la cola y envía los CVs.  
Debe ejecutarse de forma **separada** al servidor Next.js.

```bash
# Instalar dependencias
npm install

# Arrancar el worker (en una terminal separada)
npm run worker

# O con más concurrencia (procesa 5 envíos en paralelo)
WORKER_CONCURRENCY=5 npm run worker
```

### Escalar horizontalmente

Para gestionar más usuarios, simplemente arranca más workers en distintos servidores:

```bash
# Servidor 1
npm run worker

# Servidor 2 (en otra máquina)
npm run worker

# Servidor 3 (en otra máquina más)
npm run worker
```

Redis distribuye automáticamente los trabajos entre todos los workers activos.

### Límites por plan

| Plan | CVs por día | CVs por mes | Precio |
|------|------------|-------------|--------|
| Free | 2 | 20 | Gratis |
| Pro | 10 | 200 | De pago |
| Empresa | Ilimitado | Ilimitado | De pago |

- Mínimo **90 días** entre envíos a la misma empresa
- Solo días laborables: **lunes a viernes, 9:00-18:00** (hora española)
- No envía en festivos nacionales de España

### Variables de entorno necesarias

Copia `.env.example` a `.env.local` y rellena los valores:

```bash
cp .env.example .env.local
```

| Variable | Descripción | Dónde obtenerla |
|----------|-------------|----------------|
| `REDIS_URL` | URL de Redis | `redis://localhost:6379` en local |
| `RESEND_API_KEY` | API key de Resend para emails | https://resend.com |
| `FROM_EMAIL` | Email de remitente | Verificar en Resend |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase | https://supabase.com/dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio de Supabase | Panel de Supabase > Settings > API |
| `WORKER_CONCURRENCY` | Jobs en paralelo por worker | `1` para empezar |
| `MAX_CVS_PER_DAY_FREE` | Límite diario plan gratuito | `2` por defecto |
| `MAX_CVS_PER_DAY_PRO` | Límite diario plan Pro | `10` por defecto |

### Estructura del sistema

```
lib/cv-sender/
  ├── queue.ts           → Colas BullMQ + conexión Redis
  ├── worker.ts          → Worker que procesa los envíos
  ├── scheduler.ts       → Planificador (horario laboral, festivos)
  ├── rate-limiter.ts    → Control de límites por plan
  ├── email-sender.ts    → Envío de emails con Resend
  ├── cv-personalizer.ts → Personalización con OpenClaw IA
  └── tracker.ts         → Registro de envíos en Supabase

app/api/cv-sender/
  ├── send/route.ts      → POST: programar envío
  ├── status/route.ts    → GET: estado de envíos
  └── cancel/route.ts    → DELETE: cancelar envío

components/
  ├── CVSenderDashboard.tsx  → Panel de control de envíos
  └── AutoSendSetup.tsx      → Formulario de configuración

app/app/envios/page.tsx      → Página completa con tabs
scripts/start-worker.ts      → Script de arranque del worker
```

### Tablas necesarias en Supabase

Crea estas tablas en tu proyecto de Supabase:

```sql
-- Tabla de envíos de CV
CREATE TABLE cv_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  company_email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_url TEXT,
  job_title TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente',
  job_id TEXT,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de blacklist de empresas
CREATE TABLE cv_blacklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_email TEXT UNIQUE NOT NULL,
  reason TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de CVs del usuario
CREATE TABLE cvs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  text_content TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de perfiles de usuario
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  plan TEXT DEFAULT 'free'
);
```
