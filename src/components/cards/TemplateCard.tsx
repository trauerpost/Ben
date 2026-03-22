import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import type { CardTemplate } from "@/lib/supabase/types";

interface TemplateCardProps {
  template: CardTemplate;
}

export default function TemplateCard({ template }: TemplateCardProps) {
  const t = useTranslations("templates");

  return (
    <div className="group rounded-xl border border-brand-border overflow-hidden bg-white hover:shadow-lg transition-shadow">
      <div className="relative aspect-[3/4] bg-brand-light-gray">
        {template.preview_url ? (
          <Image
            src={template.preview_url}
            alt={template.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-gray text-sm">
            {template.name}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-brand-dark mb-1">{template.name}</h3>
        <div className="flex flex-wrap gap-1 mb-3">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-brand-light-gray text-brand-gray"
            >
              {tag}
            </span>
          ))}
        </div>
        <Link
          href={`/builder?template=${template.id}`}
          className="block text-center text-sm bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary-hover transition-colors"
        >
          {t("useTemplate")}
        </Link>
      </div>
    </div>
  );
}
