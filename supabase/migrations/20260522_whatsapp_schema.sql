-- Añadir campo whatsapp_phone a profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT DEFAULT NULL;

-- Tabla para mensajes WhatsApp entrantes
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id TEXT PRIMARY KEY,
  from_number TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  text TEXT,
  timestamp BIGINT,
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar por número de teléfono
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from ON whatsapp_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user ON whatsapp_messages(user_id);

-- RLS
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Solo el service role puede insertar/leer (webhook server-side)
CREATE POLICY "service_role_all" ON whatsapp_messages
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
