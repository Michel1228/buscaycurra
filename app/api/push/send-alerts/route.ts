/**
 * 🔒 SELLO ALERTAS - BuscayCurra
 * 
 * FLUJO CORRECTO (NO ROMPER):
 *   1. job_alerts (VPS PG) -> alertas activas cada 2h
 *   2. searchJobsReal -> JobListing (VPS PG)
 *   3. sendPush -> push_subscriptions (VPS PG)
 *   4. user_contacts (VPS PG) -> email + whatsapp_phone
 *   5. sendJobAlertEmail (Resend SMTP)
 *   6. enviarAlertaWhatsApp (Meta API v21)
 * 
 * NO DEPENDE DE SUPABASE - usa VPS PostgreSQL
 * Supabase notificaciones es opcional (try/catch)
 * 
 * Cron: 0 */3 * * * (cada 3h)
 *   curl -H "Authorization: Bearer ***"
 *   https://buscaycurra.es/api/push/send-alerts
 * 
 * Tablas VPS PG necesarias:
 *   job_alerts, user_contacts, push_subscriptions, JobListing
 * 
 * Tests: sello-verificacion.mjs bloque 3
 *
 * /api/push/send-alerts
 * Worker que busca alertas de empleo pendientes, encuentra nuevas ofertas
 * y envia notificaciones push + email + WhatsApp + registra en Supabase.
 * Se llama desde crontab del VPS cada 3 horas.
 * Autenticacion: Authorization: Bearer ***
 */3 * * * (cada 3h)                            │
 * │    curl -H "Authorization: Bearer ***                      │
 * │    https://buscaycurra.es/api/push/send-alerts              │
 * │                                                             │
 * │ 📊 Tablas VPS PG necesarias:                                │
 * │    job_alerts, user_contacts, push_subscriptions,           │
 * │    JobListing                                               │
 * │                                                             │
 * │ ✅ Tests: sello-verificacion.mjs bloque 3                   │
 * └─────────────────────────────────────────────────────────────┘
 *
 * /api/push/send-alerts
 * Worker que busca alertas de empleo pendientes, encuentra nuevas ofertas
 * y envía notificaciones push + email + WhatsApp + registra en Supabase.
 * Se llama desde crontab del VPS cada 3 horas.
