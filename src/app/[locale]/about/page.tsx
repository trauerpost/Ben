import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-light text-brand-dark mb-4">
          {t("title")}
        </h1>
        <p className="text-lg text-brand-gray max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
      </div>

      {/* Story */}
      <section className="mb-20">
        <h2 className="text-2xl font-medium text-brand-dark mb-6">
          {t("story.title")}
        </h2>
        <div className="space-y-4 text-brand-gray leading-relaxed">
          <p>{t("story.p1")}</p>
          <p>{t("story.p2")}</p>
          <p>{t("story.p3")}</p>
        </div>
      </section>

      {/* Values */}
      <section className="mb-20">
        <h2 className="text-2xl font-medium text-brand-dark mb-8 text-center">
          {t("values.title")}
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {(["personal", "quality", "fast", "custom"] as const).map((key) => (
            <div
              key={key}
              className="bg-brand-light-gray rounded-2xl p-8 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-4">
                <span className="text-brand-primary text-xl">
                  {key === "personal" ? "💬" : key === "quality" ? "✨" : key === "fast" ? "⚡" : "🎨"}
                </span>
              </div>
              <h3 className="text-lg font-medium text-brand-dark mb-2">
                {t(`values.${key}.title`)}
              </h3>
              <p className="text-brand-gray text-sm leading-relaxed">
                {t(`values.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="bg-brand-primary/5 rounded-2xl p-10 text-center">
        <h2 className="text-2xl font-medium text-brand-dark mb-6">
          {t("contact.title")}
        </h2>
        <div className="flex flex-col md:flex-row justify-center gap-8 mb-8">
          <div>
            <p className="text-sm text-brand-gray mb-1">Telefon</p>
            <a
              href="tel:+4915111815086"
              className="text-brand-dark font-medium hover:text-brand-primary transition-colors"
            >
              {t("contact.phone")}
            </a>
          </div>
          <div>
            <p className="text-sm text-brand-gray mb-1">E-Mail</p>
            <a
              href="mailto:info@trauerpost.com"
              className="text-brand-dark font-medium hover:text-brand-primary transition-colors"
            >
              {t("contact.email")}
            </a>
          </div>
          <div>
            <p className="text-sm text-brand-gray mb-1">Erreichbarkeit</p>
            <p className="text-brand-dark font-medium">{t("contact.hours")}</p>
          </div>
        </div>
        <Link
          href="/contact"
          className="inline-block bg-brand-primary text-white px-8 py-3 rounded-lg hover:bg-brand-primary-hover transition-colors font-medium"
        >
          {t("contact.cta")}
        </Link>
      </section>
    </div>
  );
}
