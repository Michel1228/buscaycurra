# 🔍 Auditoría SEO — BuscayCurra

**Fecha:** 2026-06-26  
**URL base:** https://buscaycurra.es  
**Framework:** Next.js 15.5.15 (App Router)

---

## 📊 RESUMEN EJECUTIVO

| Área | Estado | Issues |
|------|--------|--------|
| Metadata básica | ✅ Bueno | 1 minor |
| Open Graph / Twitter | ✅ Excelente | 0 |
| Structured Data (JSON-LD) | ⚠️ Regular | 3 faltantes |
| Sitemap | ⚠️ Regular | 2 issues |
| Robots.txt | ⚠️ Regular | 1 duplicación |
| Canonical URLs | ⚠️ Regular | 2 issues |
| hreflang / i18n | 🔴 Deficiente | 3 issues |
| Performance / CWV | 🔴 Crítico | 5 issues |
| Duplicate Content | 🟡 Riesgo | 2 issues |
| Indexabilidad | ⚠️ Regular | 3 issues |

---

## 🔴 CRÍTICO (Alta prioridad)

### 1. Canonical URL global mal configurado
**Archivo:** `app/layout.tsx:79-85`  
**Problema:** El root layout define `alternates.canonical: "https://buscaycurra.es"`. Todas las páginas que NO sobrescriben canonical heredan el de la homepage.  
**Impacto:** Google puede indexar páginas internas con canonical a la home → contenido duplicado, pérdida de rankings.  
**Mitigación parcial:** Páginas como `/trabajar-en`, `/empleo`, `/trabajar-en/[pais]` y `/trabajar-en/[pais]/[keyword]` y `/empleo/[puesto]/[ciudad]` sí sobrescriben canonical correctamente. Pero páginas como `/sobre-nosotros`, `/privacidad`, `/terminos`, `/aviso-legal`, `/cookies`, `/empresas`, etc. NO lo hacen.  
**Fix:** Eliminar `alternates` del root layout y definirlo solo en layouts de ruta específicos, O sobrescribir canonical en cada ruta.

### 2. `Cache-Control: no-store` en TODAS las páginas HTML
**Archivo:** `next.config.ts:27-33`  
**Problema:** Los headers `Cache-Control: no-store, must-revalidate` se aplican a todas las rutas HTML. Esto impide que CDNs y navegadores cacheaden contenido, aumentando TTFB y carga del servidor.  
**Impacto:** Core Web Vitals degradados (LCP, TTFB), más carga en el servidor, peor experiencia de usuario.  
**Fix:** Cambiar a `s-maxage=60, stale-while-revalidate=300` para páginas públicas, con `no-store` solo para rutas `/app/*` y `/auth/*`.

### 3. Sin `favicon.ico`
**Archivo:** `public/`  
**Problema:** No existe `favicon.ico` en el directorio público. Los navegadores solicitan `/favicon.ico` por defecto, generando 404s.  
**Fix:** Añadir `favicon.ico` a `public/` o usar `app/icon.ico`.

### 4. Google Fonts cargado de forma render-blocking
**Archivo:** `app/globals.css:39`  
**Problema:** `@import url('https://fonts.googleapis.com/css2?family=Inter...')` en CSS bloquea el renderizado hasta que la fuente se descarga.  
**Impacto:** Aumenta LCP, penaliza Core Web Vitals.  
**Fix:** Usar `next/font/google` con `display: 'swap'`:

```tsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], display: 'swap' });
```

### 5. `force-dynamic` en páginas SEO clave
**Archivos:** `app/(home)/page.tsx:13`, `app/trabajar-en/[pais]/page.tsx:7`, `app/trabajar-en/[pais]/[keyword]/page.tsx:15`  
**Problema:** La landing page y páginas de país/keyword usan `force-dynamic`, haciendo SSR en cada request. No se benefician de ISR ni static generation.  
**Impacto:** TTFB alto (~200-500ms+ por DB query en cada request), imposible cachear en CDN.  
**Fix:** Usar `revalidate` (ISR) o `generateStaticParams` + `dynamicParams: true` para pre-renderizar las páginas más visitadas.

---

## 🟡 MEDIA PRIORIDAD

### 6. Contenido duplicado: slugs y códigos ISO
**Archivos:** `app/trabajar-en/[pais]/page.tsx`  
**Problema:** Las páginas de país son accesibles tanto por slug (`/trabajar-en/estados-unidos`) como por código ISO (`/trabajar-en/us`). Ambas URLs sirven el mismo contenido pero NO tienen canonical consistente — el canonical usa el parámetro de ruta tal cual.  
**Impacto:** Google indexa ambas URLs como duplicadas.  
**Fix:** Redirigir slugs a códigos (o viceversa) con 301, o forzar canonical a la versión canónica.

### 7. Sitemap `lastModified` siempre `new Date()`
**Archivo:** `app/sitemap.ts`  
**Problema:** Todas las URLs tienen `lastModified: new Date()`. Google ve cada build como un cambio masivo.  
**Fix:** Usar fechas reales de modificación (de BD o git) o al menos `undefined` para páginas estáticas que no cambian.

### 8. `robots.txt` duplicado (estático + dinámico)
**Archivos:** `public/robots.txt` + `app/robots.ts`  
**Problema:** Existen dos fuentes de robots.txt con reglas ligeramente diferentes:
- `public/robots.txt` bloquea `/app/`, `/auth/`, `/api/` y tiene reglas específicas para Googlebot
- `app/robots.ts` bloquea `/app/`, `/api/`, `/auth/callback/`

Según Next.js, `robots.ts` genera el endpoint dinámico, pero el archivo estático puede causar confusión o ser servido en su lugar dependiendo de la configuración del servidor.  
**Fix:** Eliminar `public/robots.txt` y consolidar todas las reglas en `app/robots.ts`.

### 9. hreflang: `/en` no existe pero está declarado
**Archivo:** `app/layout.tsx:81-84`  
**Problema:** El layout declara `alternates.languages: { es: "/", en: "/en" }` y en el `<head>` hay `<link rel="alternate" hrefLang="en" href="https://buscaycurra.es/en">`. Pero la ruta `/en` no existe en el proyecto.  
**Impacto:** Googlebot encuentra hreflang apuntando a 404 → señal negativa de calidad.  
**Fix:** Eliminar la referencia a `/en` hasta que exista la traducción, o crear la ruta.

### 10. hreflang en páginas de país mal implementado
**Archivos:** `app/trabajar-en/[pais]/page.tsx:13-24`, `app/trabajar-en/[pais]/[keyword]/page.tsx:116-127`  
**Problema:** Los hreflang tags mapean cada idioma a `https://buscaycurra.es/trabajar-en/{codigo}` — pero no hay versiones traducidas de estas páginas. Todos los hreflang apuntan a la misma página en español. Google interpreta esto como auto-referenciación incorrecta.  
**Fix:** No incluir hreflang tags hasta que existan versiones en otros idiomas.

### 11. Sin `FAQPage` structured data en la landing
**Archivo:** `app/(home)/page.tsx:229-238`  
**Problema:** La landing tiene 8 preguntas frecuentes con respuestas detalladas, pero no hay JSON-LD `FAQPage` schema. Esto impide obtener rich results de FAQ en Google.  
**Fix:** Añadir `<script type="application/ld+json">` con `FAQPage` schema en la landing page.

### 12. `app/page.tsx` está vacío (0 bytes)
**Archivo:** `app/page.tsx`  
**Problema:** El archivo existe pero está vacío. La ruta real de la home está en `app/(home)/page.tsx`. El archivo vacío podría causar warnings de build o confusión.  
**Fix:** Eliminar `app/page.tsx`.

---

## 🟢 BAJA PRIORIDAD / RECOMENDACIONES

### 13. Sin `Organization` schema de alto nivel
**Problema:** Solo hay `Organization` embebido dentro de `WebApplication.author`. Google prefiere un `Organization` schema independiente con `sameAs` para redes sociales, logo, etc.  
**Fix:** Añadir `Organization` JSON-LD con `@id` y referenciarlo desde `WebApplication.author`.

### 14. Sin breadcrumb structured data
**Problema:** Páginas como `/trabajar-en/[pais]`, `/trabajar-en/[pais]/[keyword]`, `/empleo/[puesto]/[ciudad]` no tienen `BreadcrumbList` schema.  
**Fix:** Añadir breadcrumb JSON-LD en estas páginas para obtener rich results de breadcrumbs.

### 15. `manifest.json` inconsistente (dice 19 países, son 24)
**Archivo:** `public/manifest.json:5`  
**Problema:** La descripción dice "emigra a 19 países" pero `NUM_PAISES` = 24.  
**Fix:** Actualizar a "emigra a 24 países".

### 16. Sin `Content-Security-Policy` header
**Archivo:** `next.config.ts`  
**Problema:** Faltan headers CSP para protección contra XSS.  
**Fix:** Añadir CSP header en `next.config.ts` headers.

### 17. Sin `apple-touch-icon` sizes completos
**Archivo:** `app/layout.tsx:114`  
**Problema:** Solo hay un `<link rel="apple-touch-icon" href="/icon-192.png">` sin `sizes`. iOS espera `180x180` para el icono en home screen.  
**Fix:** Añadir `<link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png">`.

### 18. `JobPosting` schema sin `validThrough`
**Archivo:** `app/empleo/oferta/[id]/page.tsx:56-75`  
**Problema:** El schema `JobPosting` no incluye `validThrough`. Google requiere esta propiedad para mostrar fechas de validez. Tampoco incluye `employmentType`, `salary`, o `identifier`.  
**Fix:** Añadir `validThrough`, `employmentType` (si disponible), y `baseSalary` si hay datos de salario.

---

## 📈 LO QUE ESTÁ BIEN ✅

1. **Metadata base completa:** title, description, keywords, robots en root layout
2. **Open Graph completo:** title, description, url, locale, type, siteName, alternateLocale, imagen 1200x630
3. **Twitter Cards:** `summary_large_image` con title, description, imagen
4. **`metadataBase` configurado:** `new URL("https://buscaycurra.es")`
5. **viewport config:** `device-width, initialScale=1`
6. **PWA manifest:** Completo con icons, shortcuts, máscaras, categorías
7. **Canonical correcto en páginas clave:** `/trabajar-en`, `/empleo`, `/[pais]`, `/[pais]/[keyword]`, `/[puesto]/[ciudad]` sobrescriben canonical explícitamente
8. **`JobPosting` schema en páginas de oferta:** Correcto aunque incompleto
9. **`WebApplication` + `WebSite` + `SearchAction` schema:** Bien implementados en layout
10. **`robots` metadata:** `index: true, follow: true` en root layout
11. **Sitemap generado dinámicamente:** Incluye static pages + country pages + keyword pages
12. **Security headers:** X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS preload
13. **iOS splash screens:** Configurados para múltiples tamaños de dispositivo
14. **PWA update flow:** Service worker con detección de nuevas versiones y banner de actualización
15. **Interlinking interno:** Landing → país → keyword → oferta, buena arquitectura de silos SEO

---

## 🎯 PLAN DE ACCIÓN (Orden de prioridad)

1. **Hoy:** Quitar `canonical` global del root layout → añadir en cada ruta o layout específico
2. **Hoy:** Quitar `force-dynamic` de la landing y páginas de país, usar ISR con `revalidate`
3. **Hoy:** Cambiar Google Fonts a `next/font/google` con `display: swap`
4. **Mañana:** Añadir `favicon.ico`
5. **Mañana:** Consolidar `robots.txt` (eliminar estático)
6. **Mañana:** Eliminar hreflang `/en` hasta que exista
7. **Esta semana:** Añadir `FAQPage` schema en landing
8. **Esta semana:** Corregir duplicate content de slugs vs códigos ISO
9. **Esta semana:** Añadir `BreadcrumbList` schema
10. **Próxima semana:** Mejorar `JobPosting` schema con `validThrough`, `employmentType`
11. **Próxima semana:** Corregir `manifest.json` (19→24 países)
12. **Próxima semana:** Añadir `Organization` schema independiente
13. **Futuro:** Implementar CSP header
14. **Futuro:** Crear versión `/en` si se quiere el hreflang
