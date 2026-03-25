import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const locale = formData.get("locale") as string || "de";
  const redirect = formData.get("redirect") as string || "";

  if (!email || !password) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=missing`, request.url));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  const target = redirect ? `/${locale}${redirect}` : `/${locale}/dashboard`;
  return NextResponse.redirect(new URL(target, request.url));
}
