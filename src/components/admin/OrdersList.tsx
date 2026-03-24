"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import type { Order, OrderStatus } from "@/lib/supabase/types";
import OrderStatusBadge from "./OrderStatusBadge";
import OrderActions from "./OrderActions";

interface OrderWithCustomer extends Order {
  customers: { name: string; email: string } | null;
}

interface OrdersListProps {
  initialOrders: OrderWithCustomer[];
  onOpenDetail: (order: OrderWithCustomer) => void;
}

const filterTabs: { key: string; statuses: OrderStatus[] | null }[] = [
  { key: "all", statuses: null },
  { key: "new", statuses: ["paid"] },
  { key: "printing", statuses: ["in_production"] },
  { key: "ready", statuses: ["ready_for_pickup"] },
  { key: "shipped", statuses: ["shipped"] },
  { key: "completed", statuses: ["completed"] },
  { key: "cancelled", statuses: ["cancelled"] },
];

export default function OrdersList({
  initialOrders,
  onOpenDetail,
}: OrdersListProps): React.JSX.Element {
  const t = useTranslations("admin.orders");
  const [orders, setOrders] = useState(initialOrders);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const filtered = useMemo(() => {
    let result = orders;

    // Filter by status tab
    const tab = filterTabs.find((f) => f.key === activeFilter);
    if (tab?.statuses) {
      result = result.filter((o) => tab.statuses!.includes(o.status));
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((o) => {
        const name = o.customers?.name ?? o.guest_name ?? "";
        const email = o.customers?.email ?? o.guest_email ?? "";
        return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
      });
    }

    return result;
  }, [orders, activeFilter, search]);

  async function handleStatusChange(orderId: string, newStatus: OrderStatus): Promise<void> {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? t("statusUpdateFailed"), type: "error" });
        return;
      }

      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: newStatus,
                ...(newStatus === "shipped" ? { shipped_at: new Date().toISOString() } : {}),
                ...(newStatus === "ready_for_pickup" ? { pickup_ready_at: new Date().toISOString() } : {}),
              }
            : o
        )
      );

      const msg = data.warning ?? t("statusUpdated");
      setToast({ message: msg, type: "success" });
    } catch {
      setToast({ message: t("statusUpdateFailed"), type: "error" });
    }

    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              activeFilter === tab.key
                ? "bg-brand-dark text-white"
                : "bg-brand-light-gray text-brand-gray hover:text-brand-dark"
            }`}
          >
            {t(tab.key)}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="w-full max-w-sm mb-4 px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
      />

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-sm text-brand-gray">{t("noOrders")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-brand-border">
          <table className="w-full text-sm">
            <thead className="bg-brand-light-gray">
              <tr>
                <th className="text-left p-3 font-medium text-brand-gray">{t("date")}</th>
                <th className="text-left p-3 font-medium text-brand-gray">{t("customer")}</th>
                <th className="text-left p-3 font-medium text-brand-gray">{t("type")}</th>
                <th className="text-left p-3 font-medium text-brand-gray">{t("qty")}</th>
                <th className="text-left p-3 font-medium text-brand-gray">{t("status")}</th>
                <th className="text-right p-3 font-medium text-brand-gray">{t("price")}</th>
                <th className="text-right p-3 font-medium text-brand-gray">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-brand-border hover:bg-brand-light-gray/50 cursor-pointer"
                  onClick={() => onOpenDetail(order)}
                >
                  <td className="p-3">
                    {new Date(order.created_at).toLocaleDateString("de-DE")}
                  </td>
                  <td className="p-3">
                    {order.customers?.name ?? order.guest_name ?? order.guest_email ?? "—"}
                  </td>
                  <td className="p-3 capitalize">{order.card_type}</td>
                  <td className="p-3">{order.quantity}</td>
                  <td className="p-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="p-3 text-right">
                    {order.price_cents != null
                      ? `€${(order.price_cents / 100).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <OrderActions
                      orderId={order.id}
                      status={order.status}
                      onStatusChange={handleStatusChange}
                    />
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
