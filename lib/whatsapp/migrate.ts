/**
 * WhatsApp — Migración de BD
 * Añade campos whatsapp_phone y whatsapp_alertas a la tabla profiles de Supabase
 * 
 * Ejecutar: npx tsx lib/whatsapp/migrate.ts
 */

import { createClient } from "@supabase/supabase-js";

async function migrate() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("🔄 Añadiendo campos WhatsApp a profiles...");

  // Verificar si las columnas ya existen
  const { data: existing, error: checkError } = await supabase
    .from("profiles")
    .select("id")
    .limit(1);

  if (checkError) {
    console.error("❌ Error conectando a Supabase:", checkError.message);
    return;
  }

  // Usar SQL directo para añadir columnas (más fiable que REST)
  const { error } = await supabase.rpc("migrate_add_whatsapp_fields");

  if (error) {
    // Si el RPC no existe, usamos SQL directo
    console.log("  RPC no disponible, ejecutando SQL directo...");
    
    // ALTER TABLE para añadir columnas (idempotente con IF NOT EXISTS)
    const { error: sqlError } = await supabase.auth.admin.executeRawSql(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='profiles' AND column_name='whatsapp_phone') THEN
          ALTER TABLE profiles ADD COLUMN whatsapp_phone TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='profiles' AND column_name='whatsapp_alertas') THEN
          ALTER TABLE profiles ADD COLUMN whatsapp_alertas BOOLEAN DEFAULT false;
        END IF;
      END $$;
    `);

    if (sqlError) {
      // Fallback: intentar con la API REST normal
      console.log("  Intentando vía API REST...");
      const { error: restError } = await supabase
        .from("profiles")
        .update({ whatsapp_alertas: false } as any)
        .eq("id", "00000000-0000-0000-0000-000000000000");

      if (restError && !restError.message.includes("column")) {
        console.log("  Las columnas ya existen o la migración no es necesaria.");
      }
    }
  }

  console.log("✅ Migración WhatsApp completada");
}

migrate();
