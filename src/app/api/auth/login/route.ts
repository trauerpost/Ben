import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const locale = (formData.get("locale") as string) || "de";
  const redirectPath = (formData.get("redirect") as string) || "";

  if (!email || !password) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=missing`, request.url)
    );
  }

  // Collect cookies that Supabase sets during auth
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

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  // Redirect to dashboard (or redirect path)
  const target = redirectPath ? `/${locale}${redirectPath}` : `/${locale}/dashboard`;
  const response = NextResponse.redirect(new URL(target, request.url));

  // Set all auth cookies on the redirect response
  for (const cookie of pendingCookies) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  return response;
}
