"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { Order } from "@/lib/supabase/types";

interface ShipmentsClientProps {
  orders: (Order & { customers: { name: string } | null })[];
}

export default function ShipmentsClient({ orders }: ShipmentsClientProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("admin.shipments");

  function toggleSelect(id: string): void {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function daysSince(dateStr: string): number {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  async function bulkMarkShipped(): Promise<void> {
    if (selected.size === 0) return;
    setLoading(true);

    try {
      await fetch("/api/admin/orders/bulk-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_ids: Array.from(selected),
          status: "shipped",
        }),
      });

      setSelected(new Set());
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (orders.length === 0) {
    return <p className="text-brand-gray text-sm">{t("noShipments")}</p>;
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-4">
          <button
            onClick={bulkMarkShipped}
            disabled={loading}
            className="px-4 py-2 bg-brand-primary text-white text-sm rounded-lg hover:bg-brand-primary-hover transition-colors disabled:opacity-50"
          >
            {loading ? "..." : `${t("markAllShipped")} (${selected.size})`}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-left text-brand-gray">
              <th className="py-3 px-2 w-8">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelected(new Set(orders.map((o) => o.id)));
                    } else {
                      setSelected(new Set());
                    }
                  }}
                />
              </th>
              <th className="py-3 px-2 font-medium">{t("orderDate")}</th>
              <th className="py-3 px-2 font-medium">{t("customer")}</th>
              <th className="py-3 px-2 font-medium">{t("cardType")}</th>
              <th className="py-3 px-2 font-medium">{t("qty")}</th>
              <th className="py-3 px-2 font-medium">{t("currentStatus")}</th>
              <th className="py-3 px-2 font-medium">{t("daysSinceOrder")}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const days = daysSince(order.created_at);
              const isOverdue = days > 3;
              return (
                <tr
                  key={order.id}
                  className={`border-b border-brand-border transition-colors ${
                    isOverdue ? "bg-red-50" : "hover:bg-brand-light-gray"
                  }`}
                >
                  <td className="py-3 px-2">
                    <input
                      type="checkbox"
                      checked={selected.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                    />
                  </td>
                  <td className="py-3 px-2">
                    {new Date(order.created_at).toLocaleDateString("de-DE")}
                  </td>
                  <td className="py-3 px-2">{order.customers?.name ?? "—"}</td>
                  <td className="py-3 px-2">{order.card_type ?? "Produkt"}</td>
                  <td className="py-3 px-2">{order.quantity}</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                      {order.status}
                    </span>
                  </td>
                  <td className={`py-3 px-2 ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                    {days}d {isOverdue && <span className="text-xs">({t("overdue")})</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
