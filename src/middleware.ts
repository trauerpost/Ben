import { type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const handleI18n = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // Step 1: Refresh Supabase auth token (writes updated cookies to response)
  const supabaseResponse = await updateSession(request);

  // Step 2: Run i18n routing on the (possibly cookie-updated) request
  const intlResponse = handleI18n(request);

  // Step 3: Merge Supabase auth cookies into the i18n response
  // IMPORTANT: Pass the full cookie object (name, value, AND options like
  // path, httpOnly, secure, sameSite, maxAge). Without options, mobile
  // browsers silently drop the cookies.
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie);
  });

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
