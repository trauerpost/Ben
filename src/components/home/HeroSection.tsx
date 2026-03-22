import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function HeroSection() {
  const t = useTranslations("home.hero");

  return (
    <section className="min-h-[85vh] flex items-center justify-center px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-light text-brand-dark mb-6 leading-tight tracking-tight">
          {t("headline")}
        </h1>
        <p className="text-lg md:text-xl text-brand-gray max-w-2xl mx-auto mb-10 leading-relaxed">
          {t("subheadline")}
        </p>
        <Link
          href="/templates"
          className="inline-block bg-brand-primary text-white px-10 py-4 rounded-lg text-lg font-medium hover:bg-brand-primary-hover transition-colors"
        >
          {t("cta")}
        </Link>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {(["choose", "customize", "order"] as const).map((step) => (
            <div key={step} className="p-6 rounded-xl bg-brand-light-gray">
              <div className="w-10 h-10 rounded-full bg-brand-primary-light flex items-center justify-center mb-4">
                <span className="text-brand-primary font-semibold">
                  {step === "choose" ? "1" : step === "customize" ? "2" : "3"}
                </span>
              </div>
              <h3 className="text-lg font-medium text-brand-dark mb-2">
                {t(`steps.${step}.title`)}
              </h3>
              <p className="text-sm text-brand-gray">
                {t(`steps.${step}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
