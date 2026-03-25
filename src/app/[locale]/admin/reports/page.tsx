import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";

interface MonthlyOrder {
  month: string;
  count: number;
  revenue: number;
}

interface TopCustomer {
  name: string;
  company_name: string | null;
  order_count: number;
  total_spent: number;
}

export default async function AdminReportsPage() {
  const supabase = await createServerSupabaseClient();
  const t = await getTranslations("admin.reports");

  // 1. Orders per month (last 12 months)
  const { data: orders } = await supabase
    .from("orders")
    .select("created_at, price_cents")
    .gte("created_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at");

  const monthlyMap = new Map<string, { count: number; revenue: number }>();
  for (const o of orders ?? []) {
    const month = new Date(o.created_at).toLocaleDateString("de-DE", { year: "numeric", month: "short" });
    const existing = monthlyMap.get(month) ?? { count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += (o.price_cents ?? 0);
    monthlyMap.set(month, existing);
  }
  const monthlyOrders: MonthlyOrder[] = Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    count: data.count,
    revenue: data.revenue,
  }));

  // 2. Top 10 customers by order count
  const { data: allOrders } = await supabase
    .from("orders")
    .select("customer_id, price_cents");

  const customerTotals = new Map<string, { count: number; spent: number }>();
  for (const o of allOrders ?? []) {
    if (!o.customer_id) continue;
    const existing = customerTotals.get(o.customer_id) ?? { count: 0, spent: 0 };
    existing.count += 1;
    existing.spent += (o.price_cents ?? 0);
    customerTotals.set(o.customer_id, existing);
  }

  const topCustomerIds = Array.from(customerTotals.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([id]) => id);

  const { data: customerDetails } = await supabase
    .from("customers")
    .select("id, name, company_name")
    .in("id", topCustomerIds.length > 0 ? topCustomerIds : ["__none__"]);

  const topCustomers: TopCustomer[] = topCustomerIds.map((id) => {
    const customer = customerDetails?.find((c) => c.id === id);
    const totals = customerTotals.get(id)!;
    return {
      name: customer?.name ?? "Unknown",
      company_name: customer?.company_name ?? null,
      order_count: totals.count,
      total_spent: totals.spent,
    };
  });

  // 3. Credit usage summary
  const { data: creditTransactions } = await supabase
    .from("credit_transactions")
    .select("amount");

  let totalSold = 0;
  let totalUsed = 0;
  for (const tx of creditTransactions ?? []) {
    if (tx.amount > 0) totalSold += tx.amount;
    else totalUsed += Math.abs(tx.amount);
  }

  const { data: customers } = await supabase
    .from("customers")
    .select("credits_remaining");

  const totalRemaining = (customers ?? []).reduce((sum, c) => sum + (c.credits_remaining ?? 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-light text-brand-dark mb-8">{t("title")}</h1>

      {/* Orders per month */}
      <div className="mb-10">
        <h2 className="text-lg font-medium text-brand-dark mb-4">{t("ordersPerMonth")}</h2>
        {monthlyOrders.length === 0 ? (
          <p className="text-brand-gray text-sm">Keine Daten.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-brand-gray">
                  <th className="py-3 px-2 font-medium">{t("month")}</th>
                  <th className="py-3 px-2 font-medium">{t("count")}</th>
                  <th className="py-3 px-2 font-medium">{t("revenue")}</th>
                </tr>
              </thead>
              <tbody>
                {monthlyOrders.map((m) => (
                  <tr key={m.month} className="border-b border-brand-border">
                    <td className="py-3 px-2">{m.month}</td>
                    <td className="py-3 px-2">{m.count}</td>
                    <td className="py-3 px-2">€{(m.revenue / 100).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top 10 customers */}
      <div className="mb-10">
        <h2 className="text-lg font-medium text-brand-dark mb-4">{t("topCustomers")}</h2>
        {topCustomers.length === 0 ? (
          <p className="text-brand-gray text-sm">Keine Daten.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-brand-gray">
                  <th className="py-3 px-2 font-medium">{t("customerName")}</th>
                  <th className="py-3 px-2 font-medium">{t("company")}</th>
                  <th className="py-3 px-2 font-medium">{t("orderCount")}</th>
                  <th className="py-3 px-2 font-medium">{t("totalSpent")}</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c, i) => (
                  <tr key={i} className="border-b border-brand-border">
                    <td className="py-3 px-2">{c.name}</td>
                    <td className="py-3 px-2">{c.company_name ?? "—"}</td>
                    <td className="py-3 px-2">{c.order_count}</td>
                    <td className="py-3 px-2">€{(c.total_spent / 100).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Credit usage summary */}
      <div>
        <h2 className="text-lg font-medium text-brand-dark mb-4">{t("creditSummary")}</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-brand-light-gray rounded-xl p-5">
            <p className="text-sm text-brand-gray">{t("totalSold")}</p>
            <p className="text-2xl font-light text-brand-dark">{totalSold}</p>
          </div>
          <div className="bg-brand-light-gray rounded-xl p-5">
            <p className="text-sm text-brand-gray">{t("totalUsed")}</p>
            <p className="text-2xl font-light text-brand-dark">{totalUsed}</p>
          </div>
          <div className="bg-brand-light-gray rounded-xl p-5">
            <p className="text-sm text-brand-gray">{t("totalRemaining")}</p>
            <p className="text-2xl font-light text-brand-dark">{totalRemaining}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
