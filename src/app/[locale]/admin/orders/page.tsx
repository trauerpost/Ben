import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/supabase/types";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  pending_payment: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  in_production: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  completed: "bg-brand-primary-light text-brand-primary",
  cancelled: "bg-red-100 text-red-700",
};

export default async function AdminOrdersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-light text-brand-dark mb-6">Orders</h1>

      {!orders || orders.length === 0 ? (
        <p className="text-brand-gray">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-brand-gray">
                <th className="py-3 px-2 font-medium">Date</th>
                <th className="py-3 px-2 font-medium">Customer</th>
                <th className="py-3 px-2 font-medium">Type</th>
                <th className="py-3 px-2 font-medium">Qty</th>
                <th className="py-3 px-2 font-medium">Status</th>
                <th className="py-3 px-2 font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {(orders as Order[]).map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-brand-border hover:bg-brand-light-gray transition-colors"
                >
                  <td className="py-3 px-2">
                    {new Date(o.created_at).toLocaleDateString("de-DE")}
                  </td>
                  <td className="py-3 px-2">
                    {o.guest_name ?? o.guest_email ?? o.customer_id?.slice(0, 8) ?? "—"}
                  </td>
                  <td className="py-3 px-2 capitalize">{o.card_type}</td>
                  <td className="py-3 px-2">{o.quantity}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        statusColors[o.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {o.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    {o.price_cents
                      ? `€${(o.price_cents / 100).toFixed(2)}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
