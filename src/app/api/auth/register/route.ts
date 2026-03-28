import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData();
  const email = (formData.get("email") as string)?.trim() || "";
  const password = formData.get("password") as string || "";
  const passwordConfirm = formData.get("passwordConfirm") as string || "";
  const name = (formData.get("name") as string)?.trim() || "";
  const locale = (formData.get("locale") as string) || "de";
  const redirectPath = (formData.get("redirect") as string) || "";

  // Server-side validation
  if (!name) {
    return NextResponse.redirect(
      new URL(`/${locale}/register?error=nameRequired`, request.url), 303
    );
  }
  if (!email) {
    return NextResponse.redirect(
      new URL(`/${locale}/register?error=missing`, request.url), 303
    );
  }
  if (password.length < 6) {
    return NextResponse.redirect(
      new URL(`/${locale}/register?error=passwordTooShort`, request.url), 303
    );
  }
  if (password !== passwordConfirm) {
    return NextResponse.redirect(
      new URL(`/${locale}/register?error=passwordMismatch`, request.url), 303
    );
  }

  // 1. Create auth user with service role key
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_Secret!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    const errorMsg = authError.message.includes("already")
      ? "emailExists"
      : encodeURIComponent(authError.message);
    return NextResponse.redirect(
      new URL(`/${locale}/register?error=${errorMsg}`, request.url), 303
    );
  }

  // 2. Create customer record
  const { error: customerError } = await adminSupabase.from("customers").insert({
    email,
    name,
    auth_user_id: authData.user.id,
    customer_type: "one_time",
    role: "customer",
    credits_remaining: 0,
  });

  // R2 ROLLBACK: if customer insert fails, delete auth user
  if (customerError) {
    await adminSupabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.redirect(
      new URL(`/${locale}/register?error=${encodeURIComponent(customerError.message)}`, request.url), 303
    );
  }

  // 3. Sign in to get session (same pattern as login route)
  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach((cookie) => {
            pendingCookies.push(cookie);
          });
        },
      },
    }
  );

  const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

  if (loginError) {
    // User + customer created but login failed — rare edge case
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=${encodeURIComponent(loginError.message)}`, request.url), 303
    );
  }

  // 4. Redirect to dashboard with auth cookies
  const target = redirectPath ? `/${locale}${redirectPath}` : `/${locale}/dashboard`;
  const response = NextResponse.redirect(new URL(target, request.url), 303);

  for (const cookie of pendingCookies) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  return response;
}
