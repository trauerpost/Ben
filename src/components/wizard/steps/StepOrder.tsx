"use client";

import { useState } from "react";
import type { WizardState, WizardAction } from "@/lib/editor/wizard-state";

interface StepOrderProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

export default function StepOrder({ state, dispatch }: StepOrderProps) {
  const [quantity, setQuantity] = useState(25);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sizeLabel = state.size === "postcard" ? "Postkarte (A6)" : "Groß (A5)";

  async function handlePlaceOrder() {
    if (!guestEmail.trim()) {
      alert("Please enter your email address.");
      return;
    }
    setSubmitting(true);

    // TODO: Save order to Supabase, redirect to payment
    alert("Order placed! Payment integration coming soon.");
    setSubmitting(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-light text-brand-dark text-center mb-3">
        Place Your Order
      </h2>
      <p className="text-brand-gray text-center mb-10">
        Review and confirm your order details.
      </p>

      <div className="space-y-6">
        {/* Order summary */}
        <div className="rounded-xl border border-brand-border p-6 space-y-4">
          <div className="flex justify-between">
            <span className="text-brand-gray">Card size</span>
            <span className="text-brand-dark font-medium">{sizeLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-gray">Card type</span>
            <span className="text-brand-dark font-medium">Memorial card</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-brand-gray">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 5))}
                className="w-8 h-8 rounded-lg border border-brand-border flex items-center justify-center hover:bg-brand-light-gray transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center px-2 py-1 rounded-lg border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
              <button
                onClick={() => setQuantity(quantity + 5)}
                className="w-8 h-8 rounded-lg border border-brand-border flex items-center justify-center hover:bg-brand-light-gray transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="rounded-xl border border-brand-border p-6 space-y-4">
          <h3 className="text-lg font-medium text-brand-dark">Contact Details</h3>
          <div>
            <label className="block text-sm text-brand-gray mb-1">Name</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-brand-gray mb-1">Email *</label>
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
          </div>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={submitting}
          className="w-full py-4 bg-brand-primary text-white rounded-xl text-lg font-medium hover:bg-brand-primary-hover transition-colors disabled:opacity-50"
        >
          {submitting ? "Processing..." : "Place Order"}
        </button>

        <p className="text-xs text-brand-gray text-center">
          You will receive a PDF preview and invoice by email.
        </p>
      </div>
    </div>
  );
}
