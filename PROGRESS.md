# BuscayCurra — Estado del Proyecto

> Última actualización: 06/06/2026

---

## Punto de partida actual

La app está **en producción** en https://buscaycurra.es y en **revisión de Apple App Store** (versión iOS 1.0, build 2606021817).

El rechazo de Apple fue por **Directriz 2.2 (Pruebas Beta)** — la cuenta de revisión tenía datos obvios de demo ("Demo BuscayCurra", teléfono falso, métricas en 0). No es un problema de código sino de presentación ante Apple. Pendiente responder y re-enviar con credenciales más completas.

---

## Infraestructura activa

| Servicio | Estado | URL / Puerto |
|----------|--------|-------------|
| Next.js (web) | ✅ UP | buscaycurra.es / puerto 8892 |
| API Express/Prisma | ✅ UP | interno :3001 |
| Redis | ✅ UP (healthy) | :6379 |
| PostgreSQL local | ✅ UP (healthy) | :5433 |
| Agente Telegram (Kimi K2.6) | ✅ UP | @MichellBG_Bot |
| Worker BullMQ | ✅ UP | tsx scripts/worker-entry.ts |

**VPS:** 187.124.37.183 (Hostinger)  
**Repo GitHub:** Michel1228/buscaycurra (rama: main)  
**Supabase:** ojesordjedovnpyxspxi.supabase.co

---

## Módulos implementados

### Core
- [x] **Autenticación** — Supabase Auth (login/registro/recuperar contraseña)
- [x] **Dashboard** (`/app`) — redirect a `/app/bienvenida`
- [x] **Bienvenida** (`/app/bienvenida`) — stats + ofertas recomendadas + acciones rápidas
- [x] **GusiChat** — chatbot flotante con IA (Kimi K2.6), modo incrustado en `/app/gusi`

### Búsqueda y ofertas
- [x] **Buscador** (`/app/buscar`) — integra Adzuna, Jooble, Careerjet, Arbeitnow + BD local
- [x] **Detalle de oferta** (`/app/ofertas/[id]`) — página individual con schema JobPosting
- [x] **Guardados** (`/app/guardados`) — guardar/quitar ofertas favoritas
- [x] **Salarios** (`/app/salarios`) — comparador de salarios por sector

### Candidaturas
- [x] **Pipeline** (`/app/pipeline`) — kanban de candidaturas (postulado/entrevista/oferta/rechazado)
- [x] **Envíos masivos** (`/app/envios`) — BullMQ, busca empresa + envía CV por email
- [x] **Empresas** (`/app/empresas`) — buscar empresas por nombre (Google Places), ETTs, envío personalizado, historial

### Perfil y cuenta
- [x] **Mi CV** (`/app/curriculum`) — editor completo con preview PDF descargable
- [x] **Perfil** (`/app/perfil`) — datos personales, plan Stripe, seguridad, notificaciones WhatsApp
- [x] **Plan y Stripe** — Básico (2,99€) / Pro / Empresa; webhook de pagos
- [x] **Referidos** (`/app/referidos`) — sistema de invitación con créditos

### Herramientas IA
- [x] **Entrevistas** (`/app/entrevistas`) — simulador con IA por sector y empresa
- [x] **Emigrar** (`/app/emigrar`) — guía por país (visado, alojamiento, Au Pair, programas)
- [x] **Au Pair** (`/app/au-pair`) — perfil completo, "Dear Family" letter, candidaturas

### Contenido público
- [x] **Landing** (`/`) — redirige a bienvenida si logueado, si no al login
- [x] **Precios** (`/precios`) — planes con CTA a Stripe
- [x] **Empresas públicas** (`/empresas`) — página para empresas que buscan talento
- [x] **Reviews** (`/app/reviews`) — reviews de empresas
- [x] **Ayuda** (`/app/ayuda`) — centro de ayuda / FAQ

### Infraestructura técnica
- [x] **PWA** — manifest, service worker, OfflineScreen, push notifications (VAPID)
- [x] **App iOS** — Capacitor, Fastlane, GitHub Action `ios-deploy.yml` (workflow_dispatch)
- [x] **Email retención** — Resend, envía ofertas nuevas del día a usuarios activos
- [x] **Admin** (`/app/admin`) — panel solo para admin@buscaycurra.es
- [x] **SEO** — sitemap.xml, robots.ts, schema JobPosting en ofertas
- [x] **i18n** — LanguageProvider con traducciones (ES/EN básico)
- [x] **Multi-país** — 19 países destino (uk,us,de,fr,au,ca,nl,it,se,ch,be,pt,ie,no,dk,at,fi,nz,pl)

---

## Historial de cambios recientes

### 06/06/2026
- **fix:** GusiChat en `/app/gusi` ahora llena el contenedor (no flota encima del layout)
- **fix:** Stat cards del dashboard son clickables — Ofertas→/app/buscar, CVs→/app/envios, Pipeline→/app/pipeline, Entrevistas→/app/entrevistas
- **fix:** Email de retención — cada oferta tiene link directo a `/app/ofertas/{id}` en lugar del genérico `/app/gusi`
- **fix:** OfflineScreen implementado — pantalla profesional en lugar de pantalla en blanco (crítico para iOS)
- **fix:** GusiChat abierto directamente al entrar en `/app/gusi`
- **fix:** Timeout 15s en búsqueda (elimina skeleton infinito)
- **fix:** NSLocationWhenInUseUsageDescription eliminado del capacitor.config.ts (no se usa)
- **fix:** Icono iOS 1024×1024 Guzzi con traje/sombrero/maletín

### Antes de 06/06/2026
- **sync:** Código del VPS sincronizado con GitHub — elimina componentes de Metamorfosis antigua (EvolucionUsuario, RevelacionMariposa, AvatarMariposa, BosqueAmbiente, SplashWrapper, SplashScreen, LandingFondo, LogoGuzzi, lib/especies.ts)
- **feat:** Worker BullMQ con docker-start.sh y VAPID keys reales
- **feat:** Au Pair — envío de candidaturas con attachment opcional, rate limiter básico
- **feat:** Notificaciones push — Bearer token correcto, badge real, registro en `/app/notificaciones`
- **feat:** Arbeitnow API (ofertas Germany/EU gratuitas)
- **feat:** France Travail API integration

---

## Pendiente (bugs / mejoras conocidos)

### Para iOS App Store (re-envío)
- [ ] Responder a Apple en App Store Connect con nueva cuenta de revisión (datos creíbles, no "Demo BuscayCurra")
- [ ] La cuenta demo ya tiene `plan: empresa` y `subscription_status: active` en Supabase
- [ ] Ejecutar GitHub Action `ios-deploy.yml` manualmente para generar nuevo .ipa
- [ ] Re-enviar para revisión con nota explicativa de que es una plataforma real

### Funcionales
- [ ] Página `/app/notificaciones` — revisar que muestra el historial correcto
- [ ] Verificar que el envío de CV via BullMQ llega correctamente (worker activo)
- [ ] Verificar que el cron de retención de email está activo (GitHub Action o cron externo)

### UX / diseño
- [ ] Hacer que el buscador conserve el estado al recargar (guardar en URL params)
- [ ] Completar capturas de auditoría pendientes: empresas (desktop), entrevistas (desktop)

---

## Cómo hacer deploy

```bash
# 1. Desde local → push a GitHub
git push origin main

# 2. En el VPS
ssh -i "C:/Users/miche/.ssh/hostinger_openclaw" root@187.124.37.183
cd /root/.openclaw/workspace/buscaycurra-unified
git pull origin main

# 3. Build con build-args (OBLIGATORIO pasarlos)
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://ojesordjedovnpyxspxi.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_YCsE2bdWgmtR8U9AvmfRCA_n09gvZyN \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51TL2FqPsw6T9Raor1NRKN1KAsx6nd9ex8bpNfotXsfykewT6BGlwOeoNb3j3wxQ3JzFisSirGzjPcLD4m6BziBhH00NLexB96S \
  --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY=BDy57EXay3f97rznP-2QOJOrs2KWYqgWAK-PtQ9oF8W9Yxpu9ri_kqbYKKVgHByP5wOnoEfyTLigsaLRuawblZo \
  -t buscaycurra:latest .

# 4. Reiniciar contenedor
docker stop buscaycurra-nextjs && docker rm buscaycurra-nextjs
docker run -d --name buscaycurra-nextjs \
  --network busca-y-curra_default \
  -p 8892:3000 \
  -e REDIS_URL=redis://buscaycurra-redis:6379 \
  -e API_URL=http://buscaycurra-api:3001 \
  -e SUPABASE_SERVICE_ROLE_KEY=<ver credenciales> \
  -e STRIPE_SECRET_KEY=<ver credenciales> \
  -e STRIPE_WEBHOOK_SECRET=<ver credenciales> \
  -e RESEND_API_KEY=<ver credenciales> \
  buscaycurra:latest
```

> Credenciales completas en: `C:\Users\miche\OneDrive\Escritorio\CREDENCIALES\todas_las_credenciales.txt`
