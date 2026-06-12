/**
 * 🔒 SELLO WHATSAPP - BuscayCurra
 * 
 * CONFIGURACION CORRECTA (NO TOCAR SIN LEER ESTO):
 * 
 * Plantilla Meta: buscaycurra_alerta_empleo (español)
 * NO USAR: buscaycurra_alerta_en (ingles, no existe)
 * 
 * Estructura: body(4 params) + button URL(1 param)
 *    {{1}} = nombre   {{2}} = puesto
 *    {{3}} = ciudad   {{4}} = URL (texto cuerpo)
 *    Button = misma URL (clickable)
 * 
 * Token: WHATSAPP_ACCESS_TOKEN (system user Meta)
 *    Expira ~60 dias -> regenerar en business.facebook.com
 *    Phone ID: 1148143131713343
 *    Permisos: whatsapp_business_messaging + management
 * 
 * Webhook:
 *    URL: https://buscaycurra.es/api/whatsapp/webhook
 *    Verify token: ef36ef32942ce3d7a3d6f0e34628c102
 * 
 * Flujo completo:
 *    usuario activa alertas -> job_alerts (VPS PG)
 *    -> cron cada 3h -> send-alerts -> user_contacts (VPS PG)
 *    -> sendJobAlertEmail (Resend) + enviarAlertaWhatsApp
 *    -> Meta API -> WhatsApp del usuario
 * 
 * Tests: sello-verificacion.mjs bloque 3
 *
 * WhatsApp Cloud API - envia alertas de empleo por WhatsApp
 * Meta Business Platform - Graph API v21.0
 * 
 * Requisitos:
 * - Meta Business Account
 * - WhatsApp Business App (numero de telefono verificado)
 * - Token de acceso permanente (system user token)
 * - Templates de mensaje aprobados por Meta
 * 
 * Configuracion en .env.local:
 *   WHATSAPP_PHONE_NUMBER_ID=1148143131713343
 *   WHATSAPP_ACCESS_TOKEN=***
 *   WHATSAPP_VERIFY_TOKEN=ef36ef32942ce3d7a3d6f0e34628c102
 */
WhatsApp Cloud API — envía alertas de empleo por WhatsApp
 * Meta Business Platform — Graph API v21.0
 * 
 * Requisitos:
