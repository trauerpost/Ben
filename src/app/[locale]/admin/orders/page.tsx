import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import OrdersPageClient from "@/components/admin/OrdersPageClient";

export default async function AdminOrdersPage(): Promise<React.JSX.Element> {
  const supabase = await createServerSupabaseClient();
  const t = await getTranslations("admin.orders");

  const { data: orders } = await supabase
    .from("orders")
    .select("*, customers(name, email)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-light text-brand-dark mb-6">{t("title")}</h1>
      <OrdersPageClient initialOrders={orders ?? []} />
    </div>
  );
}
