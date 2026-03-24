"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { OrderStatus } from "@/lib/supabase/types";

interface OrderActionsProps {
  orderId: string;
  status: OrderStatus;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

const transitions: Partial<Record<OrderStatus, { label: string; target: OrderStatus }[]>> = {
  paid: [{ label: "startPrinting", target: "in_production" }],
  in_production: [
    { label: "markShipped", target: "shipped" },
    { label: "readyForPickup", target: "ready_for_pickup" },
  ],
  ready_for_pickup: [{ label: "markPickedUp", target: "completed" }],
  shipped: [{ label: "markDelivered", target: "completed" }],
};

export default function OrderActions({
  orderId,
  status,
  onStatusChange,
}: OrderActionsProps): React.JSX.Element | null {
  const t = useTranslations("admin.orders");
  const [open, setOpen] = useState(false);
  const actions = transitions[status];

  if (!actions || actions.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-brand-light-gray transition-colors text-brand-gray"
        aria-label="Actions"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white border border-brand-border rounded-lg shadow-lg py-1 min-w-[180px]">
            {actions.map((action) => (
              <button
                key={action.target}
                onClick={() => {
                  setOpen(false);
                  onStatusChange(orderId, action.target);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-brand-light-gray transition-colors"
              >
                {t(action.label)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
