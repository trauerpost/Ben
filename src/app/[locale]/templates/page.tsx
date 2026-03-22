import { useTranslations } from "next-intl";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import TemplateGrid from "@/components/cards/TemplateGrid";
import type { CardTemplate } from "@/lib/supabase/types";

export default async function TemplatesPage() {
  const t = useTranslations("templates");
  const supabase = await createServerSupabaseClient();

  const { data: templates } = await supabase
    .from("card_templates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-light text-brand-dark mb-3">
          {t("title")}
        </h1>
        <p className="text-lg text-brand-gray">{t("subtitle")}</p>
      </div>

      <TemplateGrid templates={(templates as CardTemplate[]) ?? []} />
    </section>
  );
}
