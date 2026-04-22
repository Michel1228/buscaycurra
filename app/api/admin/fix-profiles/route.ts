import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://placeholder',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
);

  const results: string[] = [];

  // Test: read profiles to see what columns exist
  const { data, error } = await supabase.from("profiles").select("*").limit(2);
  if (error) {
    results.push(`profiles select ERROR: ${error.message} (${error.code})`);
  } else {
    const cols = data?.[0] ? Object.keys(data[0]) : [];
    results.push(`profiles columns: ${cols.join(", ")}`);
    results.push(`rows found: ${data?.length}`);
    if (data?.[0]) results.push(`sample: ${JSON.stringify(data[0])}`);
  }

  // Test: try to update a profile (dry run - just read)
  const { data: d2, error: e2 } = await supabase.from("profiles")
    .select("id, full_name, phone").limit(1);
  results.push(`basic select: ${e2 ? e2.message : JSON.stringify(d2)}`);

  return NextResponse.json({ results });
}
