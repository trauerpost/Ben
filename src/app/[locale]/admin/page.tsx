import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient();

  const [customers, orders, templates] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("card_templates").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Customers", value: customers.count ?? 0 },
    { label: "Orders", value: orders.count ?? 0 },
    { label: "Templates", value: templates.count ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-light text-brand-dark mb-8">
        Admin Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-6 rounded-xl border border-brand-border"
          >
            <p className="text-sm text-brand-gray mb-1">{stat.label}</p>
            <p className="text-3xl font-light text-brand-dark">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
