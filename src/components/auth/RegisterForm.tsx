"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface RegisterFormProps {
  locale: string;
  error?: string | null;
  redirect?: string | null;
}

export default function RegisterForm({ locale, error, redirect }: RegisterFormProps) {
  const t = useTranslations("register");
  const [clientError, setClientError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const passwordConfirm = (form.elements.namedItem("passwordConfirm") as HTMLInputElement).value;

    if (password.length < 6) {
      e.preventDefault();
      setClientError(t("passwordTooShort"));
      return;
    }
    if (password !== passwordConfirm) {
      e.preventDefault();
      setClientError(t("passwordMismatch"));
      return;
    }
    setClientError(null);
  }

  const displayError = clientError || (error ? getErrorMessage(error, t) : null);

  return (
    <form method="POST" className="space-y-5" onSubmit={handleSubmit}>
      <input type="hidden" name="locale" value={locale} />
      {redirect && <input type="hidden" name="redirect" value={redirect} />}

      {displayError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {displayError}
        </div>
      )}

      <div>
        <label htmlFor="register-name" className="block text-sm font-medium text-brand-dark mb-1.5">
          {t("name")}
        </label>
        <input
          id="register-name"
          name="name"
          type="text"
          placeholder={t("namePlaceholder")}
          required
          className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-white text-brand-dark placeholder:text-brand-gray/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
        />
      </div>

      <div>
        <label htmlFor="register-email" className="block text-sm font-medium text-brand-dark mb-1.5">
          {t("email")}
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          placeholder={t("emailPlaceholder")}
          required
          className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-white text-brand-dark placeholder:text-brand-gray/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
        />
      </div>

      <div>
        <label htmlFor="register-password" className="block text-sm font-medium text-brand-dark mb-1.5">
          {t("password")}
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          placeholder={t("passwordPlaceholder")}
          required
          minLength={6}
          className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-white text-brand-dark placeholder:text-brand-gray/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
        />
      </div>

      <div>
        <label htmlFor="register-password-confirm" className="block text-sm font-medium text-brand-dark mb-1.5">
          {t("passwordConfirm")}
        </label>
        <input
          id="register-password-confirm"
          name="passwordConfirm"
          type="password"
          placeholder={t("passwordConfirmPlaceholder")}
          required
          minLength={6}
          className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-white text-brand-dark placeholder:text-brand-gray/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
        />
      </div>

      <button
        type="submit"
        formAction="/api/auth/register"
        className="w-full py-3 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-primary-hover shadow-sm hover:shadow transition-all"
      >
        {t("submit")}
      </button>
    </form>
  );
}

function getErrorMessage(error: string, t: (key: string) => string): string {
  const knownErrors: Record<string, string> = {
    passwordMismatch: t("passwordMismatch"),
    passwordTooShort: t("passwordTooShort"),
    nameRequired: t("nameRequired"),
    emailExists: t("emailExists"),
    missing: t("email"),
  };
  return knownErrors[error] || decodeURIComponent(error);
}
