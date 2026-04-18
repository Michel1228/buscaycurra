import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results: string[] = [];

  // List existing buckets
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  results.push(`Existing buckets: ${listErr ? listErr.message : JSON.stringify(buckets?.map(b => b.name))}`);

  // Create 'cvs' bucket (private)
  const { error: e1 } = await supabase.storage.createBucket("cvs", {
    public: false,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
  });
  results.push(`Create 'cvs': ${e1 ? e1.message : "OK"}`);

  // Create 'profiles' bucket (public - for avatars)
  const { error: e2 } = await supabase.storage.createBucket("profiles", {
    public: true,
    fileSizeLimit: 2 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });
  results.push(`Create 'profiles': ${e2 ? e2.message : "OK"}`);

  // List buckets again
  const { data: buckets2 } = await supabase.storage.listBuckets();
  results.push(`Final buckets: ${JSON.stringify(buckets2?.map(b => b.name))}`);

  return NextResponse.json({ results });
}
