-- ═══════════════════════════════════════════════════════════════════════════
-- Migración 007: Corregir políticas RLS existentes (Auth/RLS hardening)
-- ═══════════════════════════════════════════════════════════════════════════
-- Esta migración:
-- 1. Quita políticas permisivas en ofertas (INSERT/UPDATE con true)
-- 2. Quita política FOR ALL en cv_sends (USING/WITH CHECK true)
-- 3. Quita política INSERT en notificaciones (WITH CHECK true)
-- 4. Añade RLS a profiles si no está ya habilitado
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Quitar políticas permisivas en ofertas
DROP POLICY IF EXISTS "Solo service role puede insertar/actualizar" ON ofertas;
DROP POLICY IF EXISTS "Solo service role puede actualizar ofertas" ON ofertas;

-- 2. Quitar política FOR ALL permisiva en cv_sends (de la migración 005)
DROP POLICY IF EXISTS "Service role manages cv_sends" ON cv_sends;

-- 3. Quitar política INSERT permisiva en notificaciones
DROP POLICY IF EXISTS "Service role insert notifications" ON notificaciones;

-- 4. Activar RLS en profiles (si no está ya)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas profiles: cada usuario ve/modifica solo su perfil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users view own profile'
  ) THEN
    CREATE POLICY "Users view own profile"
      ON profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users update own profile'
  ) THEN
    CREATE POLICY "Users update own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;
