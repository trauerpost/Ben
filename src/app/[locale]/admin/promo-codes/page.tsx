import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import PromoCodesClient from "@/components/admin/PromoCodesClient";
import type { PromoCode } from "@/lib/supabase/types";

export default async function AdminPromoCodesPage() {
  const supabase = await createServerSupabaseClient();
  const t = await getTranslations("admin.promoCodes");

  const { data: promoCodes } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-light text-brand-dark mb-6">{t("title")}</h1>
      <PromoCodesClient promoCodes={(promoCodes as PromoCode[]) ?? []} />
    </div>
  );
}
