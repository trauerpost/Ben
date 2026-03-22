import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function Footer() {
  const t = useTranslations("common");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-light-gray border-t border-brand-border">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <p className="text-xl font-semibold text-brand-dark mb-2">
              {t("siteName")}
            </p>
            <p className="text-sm text-brand-gray max-w-xs">{t("tagline")}</p>
          </div>

          <div className="flex gap-8 text-sm">
            <Link
              href="/about"
              className="text-brand-gray hover:text-brand-dark transition-colors"
            >
              {t("footer.about")}
            </Link>
            <Link
              href="/privacy"
              className="text-brand-gray hover:text-brand-dark transition-colors"
            >
              {t("footer.privacy")}
            </Link>
            <Link
              href="/terms"
              className="text-brand-gray hover:text-brand-dark transition-colors"
            >
              {t("footer.terms")}
            </Link>
            <Link
              href="/imprint"
              className="text-brand-gray hover:text-brand-dark transition-colors"
            >
              {t("footer.imprint")}
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-brand-border text-center text-sm text-brand-gray">
          {t("footer.copyright", { year: currentYear })}
        </div>
      </div>
    </footer>
  );
}
