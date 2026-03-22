"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/supabase/types";

export default function OrderPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState<Order | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    async function fetchOrder() {
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      setOrder(data as Order | null);
      if (data) setQuantity(data.quantity);
      setLoading(false);
    }
    fetchOrder();
  }, [orderId]);

  async function handleSubmit() {
    if (!orderId) return;
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("orders")
      .update({ quantity, status: "pending_payment" })
      .eq("id", orderId);

    // TODO: Redirect to Stripe checkout or deduct credit
    alert("Order submitted! Payment integration coming soon.");
    setLoading(false);
  }

  if (loading) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-12 text-center text-brand-gray">
        Loading...
      </section>
    );
  }

  if (!order) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-12 text-center text-brand-gray">
        Order not found.
      </section>
    );
  }

  return (
    <section className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-light text-brand-dark mb-8">
        Order Summary
      </h1>

      <div className="rounded-xl border border-brand-border p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-brand-gray">Card type</span>
          <span className="text-brand-dark capitalize">{order.card_type}</span>
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-brand-gray">Quantity</span>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 text-right px-3 py-1.5 rounded-lg border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-brand-border">
          <span className="text-brand-dark font-medium">Status</span>
          <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm">
            {order.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors disabled:opacity-50"
      >
        Proceed to Payment
      </button>
    </section>
  );
}
