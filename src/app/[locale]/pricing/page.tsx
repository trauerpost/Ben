import { useTranslations } from "next-intl";

export default function PricingPage(): React.JSX.Element {
  const t = useTranslations("pricing");

  return (
    <section className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="text-center max-w-lg">
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-primary-light">
          <svg
            className="w-8 h-8 text-brand-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-semibold text-brand-dark mb-3">
          {t("title")}
        </h1>
        <p className="text-lg text-gray-500 mb-8 leading-relaxed">
          {t("subtitle")}
        </p>
        <a
          href="mailto:kontakt@trauerpost.de"
          className="inline-block bg-brand-primary text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-brand-primary-hover transition-colors"
        >
          {t("cta")}
        </a>
      </div>
    </section>
  );
}
