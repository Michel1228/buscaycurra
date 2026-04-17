# Busca y Curra — Concepto de la App

## Resumen
App móvil/web para búsqueda de empleo que automatiza el proceso de envío de CVs y mejora la presentación del candidato.

## 3 Pilares Principales

### 1. Mejora del CV
- Subir currículum actual (PDF/foto)
- Edición y actualización del contenido
- **Limpieza de foto**: IA mejora la imagen del candidato (fondo profesional, iluminación, etc.)
- Generación automática de **carta de presentación** personalizada por empresa
- Diseño profesional del CV (plantillas atractivas)

### 2. Búsqueda de Empresas
- Geolocalización: empresas cercanas al usuario
- Filtrado por sector/industria acorde al perfil del candidato
- Sugerencias inteligentes basadas en experiencia y habilidades
- El usuario puede aceptar/rechazar sugerencias

### 3. Envío Automático
- Envío recurrente de CVs a empresas seleccionadas (diario)
- Límite configurable (ej: 5-20 CVs/día)
- Envío a buzones de empleo oficiales (ETTs, SEPE) con menor frecuencia
- Seguimiento: saber a quién se envió y si hubo respuesta
- El sistema sigue enviando hasta que el usuario consiga trabajo

## Modelo de Monetización (pendiente de definir)
- Cuota recurrente mensual
- Límite de envíos gratuitos, pago para más
- Posible modelo freemium (funciones básicas gratis, premium de pago)

## CV de Ejemplo
- Erick Joel De Leon González — Operario/Atención al Cliente, Tudela, Navarra
- Perfil: experiencia en producción industrial, hostelería, polivalente
- Este CV sirvió como referencia del tipo de usuario objetivo

## Stack Técnico (propuesta)
- **Frontend**: React Native (móvil) o Next.js (web)
- **Backend**: Node.js + Express o Python FastAPI
- **Base de datos**: PostgreSQL o Supabase
- **IA para CV**: API de Anthropic (Claude) para mejorar textos
- **IA para fotos**: API de procesamiento de imagen (remove.bg, etc.)
- **Envío emails**: Nodemailer / SendGrid
- **Geolocalización**: Google Maps API o similar
- **Hosting**: Vercel/Railway o servidor propio (Hostinger de Michel)

## Notas
- La app debe ser simple e intuitiva — los usuarios son personas buscando trabajo, no técnicos
- Priorizar móvil (la mayoría buscará desde el teléfono)
- Diseño limpio y motivador
