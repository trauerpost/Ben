"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Order, OrderStatus } from "@/lib/supabase/types";
import OrderStatusBadge from "./OrderStatusBadge";

interface OrderWithCustomer extends Order {
  customers: { name: string; email: string } | null;
}

interface OrderDetailModalProps {
  order: OrderWithCustomer;
  onClose: () => void;
}

const timelineSteps: OrderStatus[] = [
  "paid",
  "in_production",
  "ready_for_pickup",
  "shipped",
  "completed",
];

const timelineLabels: Record<string, string> = {
  paid: "Paid",
  in_production: "Printing",
  ready_for_pickup: "Ready",
  shipped: "Shipped",
  completed: "Completed",
};

export default function OrderDetailModal({
  order,
  onClose,
}: OrderDetailModalProps): React.JSX.Element {
  const t = useTranslations("admin.orders");
  const [notes, setNotes] = useState(order.shipment_notes ?? "");
  const [saving, setSaving] = useState(false);

  const currentIdx = timelineSteps.indexOf(order.status);

  async function saveNotes(): Promise<void> {
    setSaving(true);
    try {
      await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: order.status }),
      });
      // Notes saving would need a separate endpoint — for now just update locally
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-border">
          <div>
            <h2 className="text-lg font-medium text-brand-dark">
              Order #{order.id.slice(0, 8)}
            </h2>
            <p className="text-sm text-brand-gray">
              {new Date(order.created_at).toLocaleDateString("de-DE", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-brand-light-gray transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Status + Badge */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-brand-gray">{t("status")}:</span>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Timeline */}
          {order.status !== "cancelled" && order.status !== "draft" && order.status !== "pending_payment" && (
            <div>
              <div className="flex items-center gap-1">
                {timelineSteps.map((step, idx) => {
                  const reached = idx <= currentIdx;
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            reached
                              ? "bg-brand-primary text-white"
                              : "bg-brand-light-gray text-brand-gray"
                          }`}
                        >
                          {reached ? "✓" : idx + 1}
                        </div>
                        <span className="text-[10px] text-brand-gray mt-1 text-center">
                          {timelineLabels[step]}
                        </span>
                      </div>
                      {idx < timelineSteps.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 mx-1 ${
                            idx < currentIdx ? "bg-brand-primary" : "bg-brand-light-gray"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Card Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-brand-gray mb-1">{t("type")}</p>
              <p className="text-sm font-medium capitalize">{order.card_type ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-brand-gray mb-1">Format</p>
              <p className="text-sm font-medium capitalize">
                {(order.card_data as Record<string, unknown>)?.cardFormat as string ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-gray mb-1">{t("qty")}</p>
              <p className="text-sm font-medium">{order.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-brand-gray mb-1">{t("price")}</p>
              <p className="text-sm font-medium">
                {order.price_cents != null
                  ? `€${(order.price_cents / 100).toFixed(2)}`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-gray mb-1">Payment</p>
              <p className="text-sm font-medium capitalize">
                {order.payment_method ?? "—"}
              </p>
            </div>
            {order.pdf_url && (
              <div>
                <p className="text-xs text-brand-gray mb-1">PDF</p>
                <a
                  href={order.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-primary hover:underline"
                >
                  Download PDF
                </a>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div>
            <h3 className="text-sm font-medium text-brand-dark mb-2">{t("customer")}</h3>
            <div className="bg-brand-light-gray rounded-lg p-3 text-sm space-y-1">
              <p>
                <span className="text-brand-gray">Name: </span>
                {order.customers?.name ?? order.guest_name ?? "—"}
              </p>
              <p>
                <span className="text-brand-gray">Email: </span>
                {order.customers?.email ?? order.guest_email ?? "—"}
              </p>
            </div>
          </div>

          {/* Card Preview (back image from card_data) */}
          {Boolean(order.card_data && (order.card_data as Record<string, unknown>).backImageUrl) && (
            <div>
              <h3 className="text-sm font-medium text-brand-dark mb-2">Card Preview</h3>
              <img
                src={(order.card_data as Record<string, unknown>).backImageUrl as string}
                alt="Card back"
                className="rounded-lg max-h-48 object-cover"
              />
            </div>
          )}

          {/* Shipment Notes */}
          <div>
            <h3 className="text-sm font-medium text-brand-dark mb-2">Shipment Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
              placeholder="Add shipping notes..."
            />
          </div>

          {/* Timestamps */}
          <div className="text-xs text-brand-gray space-y-1">
            {order.shipped_at && (
              <p>Shipped: {new Date(order.shipped_at).toLocaleDateString("de-DE")}</p>
            )}
            {order.pickup_ready_at && (
              <p>Ready for pickup: {new Date(order.pickup_ready_at).toLocaleDateString("de-DE")}</p>
            )}
            {order.invoice_id && (
              <p>Invoice: #{order.invoice_id.slice(0, 8)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
