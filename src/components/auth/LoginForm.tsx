import { useTranslations } from "next-intl";

interface LoginFormProps {
  locale: string;
  error?: string | null;
  redirect?: string | null;
}

export default function LoginForm({ locale, error, redirect }: LoginFormProps) {
  const t = useTranslations("login");

  return (
    <form method="POST" className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      {redirect && <input type="hidden" name="redirect" value={redirect} />}

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
          name="email"
          type="email"
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
        </div>
        <input
          id="login-password"
          name="password"
          type="password"
          placeholder={t("passwordPlaceholder")}
          required
          className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-white text-brand-dark placeholder:text-brand-gray/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
        />
      </div>

      <button
        type="submit"
        formAction="/api/auth/login"
        className="w-full py-3 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-primary-hover shadow-sm hover:shadow transition-all"
      >
        {t("submit")}
      </button>
    </form>
  );
}
