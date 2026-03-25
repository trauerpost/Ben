import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();

  // Admin auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: adminCheck } = await supabase
    .from("customers")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (!adminCheck || adminCheck.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { code, discount_type, discount_value, max_uses, expires_at, customer_id } = body;

  if (!code || !discount_type || !discount_value) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (discount_type === "percent" && (discount_value < 1 || discount_value > 100)) {
    return NextResponse.json({ error: "Percent discount must be 1-100" }, { status: 400 });
  }

  // Check for duplicate code
  const { data: existing } = await supabase
    .from("promo_codes")
    .select("id")
    .eq("code", code.toUpperCase())
    .single();

  if (existing) {
    return NextResponse.json({ error: "Code already exists" }, { status: 409 });
  }

  const { data: promo, error } = await supabase
    .from("promo_codes")
    .insert({
      code: code.toUpperCase(),
      discount_type,
      discount_value,
      max_uses: max_uses || null,
      expires_at: expires_at || null,
      customer_id: customer_id || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(promo, { status: 201 });
}
