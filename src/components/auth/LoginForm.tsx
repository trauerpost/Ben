"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("login");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Hard navigation ensures the browser sends the freshly-set auth cookies
    // to the server. router.push() does client-side navigation which may not
    // include the new cookies in the server request, causing getUser() to
    // return null and redirect back to /login.
    // Check for redirect parameter (e.g. from product page)
    const params = new URLSearchParams(window.location.search);
    const redirectPath = params.get("redirect");
    const locale = window.location.pathname.split("/")[1] || "de";

    if (redirectPath) {
      window.location.href = `/${locale}${redirectPath}`;
    } else {
      window.location.href = `/${locale}/dashboard`;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="login-email"
          className="block text-sm font-medium text-brand-dark mb-1.5"
        >
          {t("email")}
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          required
          className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-white text-brand-dark placeholder:text-brand-gray/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="login-password"
            className="block text-sm font-medium text-brand-dark"
          >
            {t("password")}
          </label>
          <button
            type="button"
            className="text-xs text-brand-primary hover:text-brand-primary-hover font-medium transition-colors"
          >
            {t("forgotPassword")}
          </button>
        </div>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("passwordPlaceholder")}
          required
          className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-white text-brand-dark placeholder:text-brand-gray/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-primary-hover shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t("loading") : t("submit")}
      </button>
    </form>
  );
}
