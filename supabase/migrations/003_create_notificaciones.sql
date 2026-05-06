-- Tabla de notificaciones de usuario
CREATE TABLE IF NOT EXISTS notificaciones (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL DEFAULT 'info',
  titulo      TEXT NOT NULL,
  mensaje     TEXT DEFAULT '',
  datos       JSONB DEFAULT '{}',
  leida       BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_user_id  ON notificaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida    ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created  ON notificaciones(created_at DESC);

ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON notificaciones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON notificaciones FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role insert notifications"
  ON notificaciones FOR INSERT
  WITH CHECK (true);
