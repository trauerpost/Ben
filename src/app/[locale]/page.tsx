import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-light text-brand-dark mb-4">
          {t("hero.headline")}
        </h1>
        <p className="text-lg text-brand-gray max-w-xl mx-auto mb-8">
          {t("hero.subheadline")}
        </p>
        <a
          href="#"
          className="inline-block bg-brand-primary text-white px-8 py-3 rounded-lg text-lg hover:bg-brand-primary-hover transition-colors"
        >
          {t("hero.cta")}
        </a>
      </div>
    </main>
  );
}
