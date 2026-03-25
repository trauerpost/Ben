import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import ShipmentsClient from "@/components/admin/ShipmentsClient";
import type { Order } from "@/lib/supabase/types";

export default async function AdminShipmentsPage() {
  const supabase = await createServerSupabaseClient();
  const t = await getTranslations("admin.shipments");

  const { data: orders } = await supabase
    .from("orders")
    .select("*, customers(name)")
    .in("status", ["paid", "in_production", "ready_for_pickup", "shipped"])
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-light text-brand-dark mb-6">{t("title")}</h1>
      <ShipmentsClient orders={(orders as (Order & { customers: { name: string } | null })[]) ?? []} />
    </div>
  );
}
