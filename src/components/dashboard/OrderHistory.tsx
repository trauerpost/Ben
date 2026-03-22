import type { Order } from "@/lib/supabase/types";

interface OrderHistoryProps {
  orders: Order[];
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  pending_payment: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  in_production: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  completed: "bg-brand-primary-light text-brand-primary",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrderHistory({ orders }: OrderHistoryProps) {
  if (orders.length === 0) {
    return (
      <p className="text-brand-gray text-sm py-8 text-center">
        No orders yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-brand-border text-left text-brand-gray">
            <th className="py-3 px-2 font-medium">Date</th>
            <th className="py-3 px-2 font-medium">Type</th>
            <th className="py-3 px-2 font-medium">Qty</th>
            <th className="py-3 px-2 font-medium">Status</th>
            <th className="py-3 px-2 font-medium">Price</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="border-b border-brand-border hover:bg-brand-light-gray transition-colors"
            >
              <td className="py-3 px-2">
                {new Date(order.created_at).toLocaleDateString("de-DE")}
              </td>
              <td className="py-3 px-2 capitalize">{order.card_type}</td>
              <td className="py-3 px-2">{order.quantity}</td>
              <td className="py-3 px-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    statusColors[order.status] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {order.status.replace("_", " ")}
                </span>
              </td>
              <td className="py-3 px-2">
                {order.price_cents
                  ? `€${(order.price_cents / 100).toFixed(2)}`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
