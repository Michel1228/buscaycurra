-- ═══════════════════════════════════════════════════════════════════════════
-- Migración 001: Añadir columnas de CV, plan de pago y cliente de Stripe
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Añadir columna para la URL del CV en Supabase Storage
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- Añadir columna para el plan del usuario: 'free', 'pro' o 'empresa'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

-- Añadir columna para el ID de cliente en Stripe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- ─── Bucket de Supabase Storage para CVs ─────────────────────────────────────
-- Bucket privado: solo accesible a través de URLs firmadas o políticas RLS
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', false)
ON CONFLICT DO NOTHING;

-- ─── Política de storage: cada usuario solo accede a su propio CV ─────────────
CREATE POLICY "Usuario accede a su CV"
ON storage.objects
FOR ALL
USING (
  auth.uid()::text = (storage.foldername(name))[1]
);
