import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import SeedButton from "@/components/admin/SeedButton";

export default async function AdminDashboard(): Promise<React.JSX.Element> {
  const supabase = await createServerSupabaseClient();
  const t = await getTranslations("admin.dashboard");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    newOrdersToday,
    pendingPrinting,
    readyToShip,
    revenueThisMonth,
    lowCreditAlerts,
    recentOrders,
  ] = await Promise.all([
    // New orders today: status = 'paid' AND created_at >= today
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid")
      .gte("created_at", today.toISOString()),
    // Pending printing: status = 'in_production'
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_production"),
    // Ready to ship: status in (ready_for_pickup, shipped) not completed
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["ready_for_pickup", "shipped"]),
    // Revenue this month: sum of price_cents where created_at >= first of month
    supabase
      .from("orders")
      .select("price_cents")
      .gte("created_at", firstOfMonth.toISOString())
      .not("price_cents", "is", null),
    // Low credit alerts: regular customers with credits < 5
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("customer_type", "regular")
      .lt("credits_remaining", 5),
    // Recent orders (last 5)
    supabase
      .from("orders")
      .select("id, created_at, status, card_type, quantity, price_cents, customer_id, guest_email")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Calculate revenue sum client-side (Supabase JS doesn't support SUM)
  const revenueCents = (revenueThisMonth.data ?? []).reduce(
    (sum: number, o: { price_cents: number | null }) => sum + (o.price_cents ?? 0),
    0
  );

  const kpis = [
    { label: t("newOrdersToday"), value: String(newOrdersToday.count ?? 0), color: "text-blue-600" },
    { label: t("pendingPrinting"), value: String(pendingPrinting.count ?? 0), color: "text-orange-600" },
    { label: t("readyToShip"), value: String(readyToShip.count ?? 0), color: "text-green-600" },
    { label: t("revenueThisMonth"), value: `€${(revenueCents / 100).toFixed(2)}`, color: "text-brand-dark" },
    { label: t("lowCreditAlerts"), value: String(lowCreditAlerts.count ?? 0), color: (lowCreditAlerts.count ?? 0) > 0 ? "text-red-600" : "text-brand-gray" },
  ];

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    pending_payment: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    in_production: "bg-blue-100 text-blue-700",
    ready_for_pickup: "bg-purple-100 text-purple-700",
    shipped: "bg-indigo-100 text-indigo-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <h1 className="text-2xl font-light text-brand-dark mb-8">
        {t("title")}
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="p-5 rounded-xl border border-brand-border bg-white"
          >
            <p className="text-sm text-brand-gray mb-1">{kpi.label}</p>
            <p className={`text-3xl font-light ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-brand-dark mb-4">
          {t("recentOrders")}
        </h2>
        {(recentOrders.data ?? []).length === 0 ? (
          <p className="text-sm text-brand-gray">{t("noRecentOrders")}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-brand-border">
            <table className="w-full text-sm">
              <thead className="bg-brand-light-gray">
                <tr>
                  <th className="text-left p-3 font-medium text-brand-gray">Date</th>
                  <th className="text-left p-3 font-medium text-brand-gray">Type</th>
                  <th className="text-left p-3 font-medium text-brand-gray">Qty</th>
                  <th className="text-left p-3 font-medium text-brand-gray">Status</th>
                  <th className="text-right p-3 font-medium text-brand-gray">Price</th>
                </tr>
              </thead>
              <tbody>
                {(recentOrders.data ?? []).map((order) => (
                  <tr key={order.id} className="border-t border-brand-border hover:bg-brand-light-gray/50">
                    <td className="p-3">
                      {new Date(order.created_at).toLocaleDateString("de-DE")}
                    </td>
                    <td className="p-3 capitalize">{order.card_type}</td>
                    <td className="p-3">{order.quantity}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {order.price_cents != null
                        ? `€${(order.price_cents / 100).toFixed(2)}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium text-brand-dark mb-4">
          {t("quickActions")}
        </h2>
        <div className="flex gap-3">
          <Link
            href="/admin/orders"
            className="px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary-hover transition-colors"
          >
            {t("newOrder")}
          </Link>
          <Link
            href="/admin/shipments"
            className="px-4 py-2 rounded-lg border border-brand-border text-brand-dark text-sm font-medium hover:bg-brand-light-gray transition-colors"
          >
            {t("viewShipments")}
          </Link>
        </div>
      </div>

      {/* Dev-only seed button */}
      <SeedButton />
    </div>
  );
}
