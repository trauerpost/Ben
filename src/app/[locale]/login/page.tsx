import LoginForm from "@/components/auth/LoginForm";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("login");

  return (
    <section className="min-h-[calc(100dvh-4rem)] flex">
      {/* Left panel - brand visual (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-primary to-brand-primary-hover relative items-center justify-center p-12">
        <div className="relative z-10 max-w-md text-center">
          {/* Decorative leaf/cross shape */}
          <div className="mx-auto mb-8 w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white/80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v18m0-18c-4 3-7 7-7 12a7 7 0 0014 0c0-5-3-9-7-12z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-light text-white mb-4">
            {t("brandHeadline")}
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            {t("brandSubline")}
          </p>
        </div>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:32px_32px]" />
      </div>

      {/* Right panel - login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          {/* Brand name */}
          <div className="mb-10 text-center">
            <h1 className="text-2xl font-semibold text-brand-primary tracking-tight">
              Trauerpost
            </h1>
            <p className="mt-1 text-sm text-brand-gray">
              {t("subtitle")}
            </p>
          </div>

          {/* Title */}
          <h2 className="text-xl font-medium text-brand-dark mb-6">
            {t("title")}
          </h2>

          {/* Form */}
          <LoginForm />

          {/* Footer link */}
          <p className="mt-8 text-center text-sm text-brand-gray">
            {t("noAccount")}{" "}
            <span className="text-brand-primary hover:text-brand-primary-hover cursor-pointer font-medium">
              {t("register")}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
