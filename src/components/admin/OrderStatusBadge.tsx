"use client";

import type { OrderStatus } from "@/lib/supabase/types";

const statusColors: Record<OrderStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending_payment: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  in_production: "bg-blue-100 text-blue-700",
  ready_for_pickup: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const statusLabels: Record<OrderStatus, string> = {
  draft: "Draft",
  pending_payment: "Pending",
  paid: "New",
  in_production: "Printing",
  ready_for_pickup: "Ready",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps): React.JSX.Element {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        statusColors[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {statusLabels[status] ?? status.replace(/_/g, " ")}
    </span>
  );
}
