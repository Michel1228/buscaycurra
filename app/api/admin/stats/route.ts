import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "michelbatistagonzalez1992@gmail.com";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: Request) {
  // Verificar token de sesión
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const supabase = getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser(auth);
  if (authError || !user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Solo para administradores" }, { status: 403 });
  }

  const ahora = new Date();
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString();
  const inicioSemana = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
  const inicio30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Todas las queries en paralelo
  const [
    { count: totalUsuarios },
    { data: porPlan },
    { count: nuevosHoy },
    { count: nuevosSemana },
    { count: nuevosMes },
    { data: tendencia },
    { count: totalEnvios },
    { count: enviosHoy },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("plan").then(({ data }) => ({
      data: data?.reduce((acc: Record<string, number>, row) => {
        const plan = row.plan ?? "free";
        acc[plan] = (acc[plan] ?? 0) + 1;
        return acc;
      }, {}),
    })),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", inicioHoy),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", inicioSemana),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", inicioMes),
    supabase.from("profiles").select("created_at").gte("created_at", inicio30Dias).order("created_at"),
    supabase.from("cv_sends").select("id", { count: "exact", head: true }),
    supabase.from("cv_sends").select("id", { count: "exact", head: true }).gte("created_at", inicioHoy),
  ]);

  // Agrupar tendencia por día
  const tendenciaDias: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(ahora.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    tendenciaDias[key] = 0;
  }
  for (const row of (tendencia ?? [])) {
    const key = (row.created_at as string).slice(0, 10);
    if (key in tendenciaDias) tendenciaDias[key]++;
  }

  const planesCount = porPlan as Record<string, number> ?? {};
  const pagando = (planesCount["esencial"] ?? 0) + (planesCount["basico"] ?? 0) +
                  (planesCount["pro"] ?? 0) + (planesCount["empresa"] ?? 0);

  // Estimación de ingresos mensuales
  const ingresosMes =
    (planesCount["esencial"] ?? 0) * 2.99 +
    (planesCount["basico"] ?? 0) * 4.99 +
    (planesCount["pro"] ?? 0) * 9.99 +
    (planesCount["empresa"] ?? 0) * 49.99;

  return NextResponse.json({
    totalUsuarios: totalUsuarios ?? 0,
    porPlan: planesCount,
    pagando,
    ingresosMes: Math.round(ingresosMes * 100) / 100,
    nuevosHoy: nuevosHoy ?? 0,
    nuevosSemana: nuevosSemana ?? 0,
    nuevosMes: nuevosMes ?? 0,
    tendencia: Object.entries(tendenciaDias).map(([fecha, count]) => ({ fecha, count })),
    totalEnvios: totalEnvios ?? 0,
    enviosHoy: enviosHoy ?? 0,
  });
}
