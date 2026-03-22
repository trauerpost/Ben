import LoginForm from "@/components/auth/LoginForm";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("common");

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-light text-brand-dark mb-8 text-center">
          {t("nav.login")}
        </h1>
        <LoginForm />
      </div>
    </section>
  );
}
