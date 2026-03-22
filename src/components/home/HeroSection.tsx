import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";

export default function HeroSection() {
  const t = useTranslations("home.hero");

  return (
    <>
      {/* Hero with background image */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=80"
            alt="Peaceful landscape"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto text-center px-6">
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
            {t("headline")}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("subheadline")}
          </p>
          <Link
            href="/templates"
            className="inline-block bg-brand-primary text-white px-10 py-4 rounded-lg text-lg font-medium hover:bg-brand-primary-hover transition-colors shadow-lg"
          >
            {t("cta")}
          </Link>
        </div>
      </section>

      {/* How it works — 3 steps */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-light text-brand-dark text-center mb-4">
            {t("howItWorks")}
          </h2>
          <p className="text-brand-gray text-center mb-14 max-w-xl mx-auto">
            {t("howItWorksSubtitle")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {(["choose", "customize", "order"] as const).map((step, i) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-brand-primary mx-auto mb-5 flex items-center justify-center shadow-md">
                  <span className="text-white text-2xl font-light">{i + 1}</span>
                </div>
                <h3 className="text-lg font-medium text-brand-dark mb-2">
                  {t(`steps.${step}.title`)}
                </h3>
                <p className="text-sm text-brand-gray leading-relaxed">
                  {t(`steps.${step}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product categories */}
      <section className="py-20 px-6 bg-brand-light-gray">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-light text-brand-dark text-center mb-14">
            {t("products")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(["sterbebild", "trauerkarte", "dankkarte"] as const).map((card) => (
              <Link
                key={card}
                href="/templates"
                className="group relative rounded-2xl overflow-hidden aspect-[3/4] shadow-md hover:shadow-xl transition-shadow"
              >
                <Image
                  src={
                    card === "sterbebild"
                      ? "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80"
                      : card === "trauerkarte"
                      ? "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80"
                      : "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=600&q=80"
                  }
                  alt={t(`cards.${card}.title`)}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-medium text-white mb-1">
                    {t(`cards.${card}.title`)}
                  </h3>
                  <p className="text-sm text-white/70">
                    {t(`cards.${card}.description`)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Sample backgrounds preview */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-light text-brand-dark mb-4">
            {t("backgrounds")}
          </h2>
          <p className="text-brand-gray mb-12 max-w-xl mx-auto">
            {t("backgroundsSubtitle")}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
              "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=80",
              "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80",
              "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&q=80",
              "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=400&q=80",
              "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=400&q=80",
              "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&q=80",
              "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80",
            ].map((src, i) => (
              <div
                key={i}
                className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <Image
                  src={src}
                  alt={`Background ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <Link
            href="/templates"
            className="inline-block mt-10 px-8 py-3 border-2 border-brand-primary text-brand-primary rounded-lg hover:bg-brand-primary hover:text-white transition-colors font-medium"
          >
            {t("viewAll")}
          </Link>
        </div>
      </section>

      {/* CTA banner */}
      <section className="py-16 px-6 bg-brand-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-light text-white mb-4">
            {t("ctaBanner")}
          </h2>
          <p className="text-white/80 mb-8">
            {t("ctaBannerSubtitle")}
          </p>
          <Link
            href="/templates"
            className="inline-block bg-white text-brand-primary px-10 py-4 rounded-lg text-lg font-medium hover:bg-brand-light-gray transition-colors"
          >
            {t("cta")}
          </Link>
        </div>
      </section>
    </>
  );
}
