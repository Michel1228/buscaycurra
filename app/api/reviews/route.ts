/**
 * /api/reviews — Reviews de empresas
 * GET: ?company=Empresa → listar reviews + datos de Google Places
 * POST: crear review
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromToken, extractToken } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

// ─── Helpers Google Places ────────────────────────────────────────────────
async function getGooglePlaceData(companyName: string): Promise<{
  rating: number | null; totalRatings: number | null; address: string | null; mapsUrl: string | null
} | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;
  try {
    // Find Place
    const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(companyName)}&inputtype=textquery&fields=place_id,formatted_address,rating,user_ratings_total&key=${apiKey}`;
    const findRes = await fetch(findUrl);
    const findData = await findRes.json() as any;
    if (findData.status !== "OK" || !findData.candidates?.length) return null;
    const place = findData.candidates[0];
    return {
      rating: place.rating || null,
      totalRatings: place.user_ratings_total || null,
      address: place.formatted_address || null,
      mapsUrl: place.place_id ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}` : null,
    };
  } catch {
    return null;
  }
}

// ─── GET: listar reviews de una empresa ─────────────────────────────────────
export async function GET(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { searchParams } = new URL(request.url);
  const company = searchParams.get("company");

  if (!company) {
    return NextResponse.json({ error: "company requerido" }, { status: 400 });
  }

  try {
    const { data: reviews, error } = await supabaseAdmin
      .from("company_reviews")
      .select("id, rating, title, comment, pros, cons, would_recommend, created_at")
      .ilike("company_name", company)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Calcular stats
    const allReviews = reviews || [];
    const avgRating = allReviews.length > 0
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
      : "0";
    const recommendCount = allReviews.filter(r => r.would_recommend).length;
    const recommendPct = allReviews.length > 0
      ? Math.round((recommendCount / allReviews.length) * 100)
      : 0;

    return NextResponse.json({
      company,
      reviews: allReviews,
      stats: {
        total: allReviews.length,
        avgRating,
        recommendPct,
        distribution: {
          5: allReviews.filter(r => r.rating === 5).length,
          4: allReviews.filter(r => r.rating === 4).length,
          3: allReviews.filter(r => r.rating === 3).length,
          2: allReviews.filter(r => r.rating === 2).length,
          1: allReviews.filter(r => r.rating === 1).length,
        },
      },
      // Datos de Google Places (rating real, reviews, dirección, maps)
      google: await getGooglePlaceData(company),
    });
  } catch (error) {
    console.error("[reviews] Error GET:", (error as Error).message);
    return NextResponse.json({ error: "Error al obtener reviews" }, { status: 500 });
  }
}

// ─── POST: crear review ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const token = extractToken(request.headers.get("Authorization"));
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    }

    const body = await request.json() as {
      companyName: string;
      rating: number;
      title?: string;
      comment?: string;
      pros?: string;
      cons?: string;
      wouldRecommend?: boolean;
    };

    if (!body.companyName || !body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: "companyName y rating (1-5) requeridos" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("company_reviews")
      .upsert({
        user_id: user.id,
        company_name: body.companyName.trim(),
        rating: body.rating,
        title: body.title?.trim() || null,
        comment: body.comment?.trim() || null,
        pros: body.pros?.trim() || null,
        cons: body.cons?.trim() || null,
        would_recommend: body.wouldRecommend ?? null,
        created_at: new Date().toISOString(),
      }, { onConflict: "user_id,company_name" });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[reviews] Error POST:", (error as Error).message);
    return NextResponse.json({ error: "Error al crear review" }, { status: 500 });
  }
}
