export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return Response.json({
    ok: true,
    env: {
      hasAdminSecret: !!process.env.ADMIN_SECRET,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasJoobleKey: !!process.env.JOOBLE_API_KEY,
    },
    time: new Date().toISOString(),
  });
}
