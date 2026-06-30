-- ═══════════════════════════════════════════════════════════════════════════
-- Migración 006: Activar RLS en profiles
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Cada usuario solo puede ver su propio perfil
CREATE POLICY "Users view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Cada usuario solo puede modificar su propio perfil
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
