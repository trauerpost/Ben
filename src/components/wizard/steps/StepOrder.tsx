"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { clearDraft, getCardDimensions, CARD_CONFIGS } from "@/lib/editor/wizard-state";
import type { WizardState, WizardAction } from "@/lib/editor/wizard-state";
import CardMockup from "../CardMockup";

interface StepOrderProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

export default function StepOrder({ state, dispatch }: StepOrderProps) {
  const t = useTranslations("wizard.order");
  const router = useRouter();
  const [quantity, setQuantity] = useState(25);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{
    orderId: string;
    pdfUrl: string | null;
  } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const cardTypeLabel = state.cardType
    ? CARD_CONFIGS[state.cardType].label
    : "\u2014";
  const dims = getCardDimensions(state);
  const displayName = state.textContent.name || "\u2014";

  // Check auth on mount
  useEffect(() => {
    async function checkAuth(): Promise<void> {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email ?? null);
        const { data: customer } = await supabase
          .from("customers")
          .select("name")
          .eq("auth_user_id", user.id)
          .single();
        setUserName(customer?.name ?? user.user_metadata?.full_name ?? null);
      }
      setAuthChecked(true);
    }
    checkAuth();
  }, []);

  async function handlePlaceOrder(): Promise<void> {
    if (!userId) return;
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      // 1. Generate PDF
      const pdfRes = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });

      let pdfUrl: string | null = null;
      let pdfBase64: string | null = null;

      if (pdfRes.ok) {
        const contentType = pdfRes.headers.get("content-type") || "";
        if (contentType.includes("application/pdf")) {
          const buf = await pdfRes.arrayBuffer();
          pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        } else if (contentType.includes("application/json")) {
          const pdfData = await pdfRes.json();
          pdfUrl = pdfData.pdfUrl ?? null;
        }
      }

      // 2. Get customer_id
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", userId)
        .single();

      if (!customer) {
        throw new Error("Customer record not found");
      }

      // 3. Save order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customer.id,
          status: "paid",
          card_type: state.cardType,
          card_data: {
            cardFormat: state.cardFormat,
            templateId: state.templateId,
            background: state.background,
            photo: state.photo,
            textContent: state.textContent,
            decoration: state.decoration,
            border: state.border,
          },
          quantity,
          pdf_url: pdfUrl,
          payment_method: "invoice",
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      // 4. Send email with PDF attached (non-blocking)
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userEmail,
          customerName: userName,
          orderId: order.id,
          cardType: cardTypeLabel,
          quantity,
          pdfBase64,
        }),
      }).catch(() => {
        // Email failure is non-blocking
      });

      // 5. Success
      setOrderResult({ orderId: order.id, pdfUrl });
      clearDraft();
    } catch (err) {
      console.error("[StepOrder] Error:", err);
      setError(t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  // Not authenticated
  if (authChecked && !userId) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <p className="text-lg text-brand-dark mb-6">{t("loginRequired")}</p>
        <button
          onClick={() => router.push("/login?redirect=/builder")}
          className="px-8 py-3 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary-hover transition-colors"
        >
          {t("loginButton")}
        </button>
      </div>
    );
  }

  // Still checking auth
  if (!authChecked) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <p className="text-brand-gray">...</p>
      </div>
    );
  }

  // Order placed -- success
  if (orderResult) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center space-y-6">
        <CardMockup state={state} style="table" />
        <h2 className="mt-6 text-2xl font-serif text-brand-dark">{t("successTitle")}</h2>
        <p className="text-brand-gray">{t("successMessage")}</p>
        <p className="text-brand-gray">
          {t("orderNumber")}: <span className="font-mono">{orderResult.orderId.slice(0, 8)}</span>
        </p>
        <div className="flex gap-4 justify-center mt-6">
          {orderResult.pdfUrl && (
            <a
              href={orderResult.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary-hover transition-colors"
            >
              {t("downloadPdf")}
            </a>
          )}
          <button
            onClick={() => dispatch({ type: "RESET" })}
            className="px-6 py-3 text-brand-primary border border-brand-primary rounded-xl font-medium hover:bg-brand-primary/5 transition-colors"
          >
            {t("newCard")}
          </button>
        </div>
      </div>
    );
  }

  // Order form
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-light text-brand-dark text-center mb-3">
        {t("title")}
      </h2>
      <p className="text-brand-gray text-center mb-10">
        {t("subtitle")}
      </p>

      <div className="space-y-6">
        {/* Order summary */}
        <div className="rounded-xl border border-brand-border p-6 space-y-4">
          <div className="flex justify-between">
            <span className="text-brand-gray">{t("cardTypeLabel")}</span>
            <span className="text-brand-dark font-medium">{cardTypeLabel}</span>
          </div>
          {dims && (
            <div className="flex justify-between">
              <span className="text-brand-gray">{t("dimensions")}</span>
              <span className="text-brand-dark font-medium">{dims.description}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-brand-gray">{t("nameLabel")}</span>
            <span className="text-brand-dark font-medium">{displayName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-brand-gray">{t("quantity")}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 5))}
                className="w-8 h-8 rounded-lg border border-brand-border flex items-center justify-center hover:bg-brand-light-gray transition-colors"
              >
                &minus;
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

        {/* Logged-in user info */}
        <div className="rounded-xl border border-brand-border p-6 space-y-2">
          <h3 className="text-lg font-medium text-brand-dark">{t("contactTitle")}</h3>
          {userName && <p className="text-brand-dark">{userName}</p>}
          {userEmail && <p className="text-brand-gray text-sm">{userEmail}</p>}
        </div>

        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={submitting}
          className="w-full py-4 bg-brand-primary text-white rounded-xl text-lg font-medium hover:bg-brand-primary-hover transition-colors disabled:opacity-50"
        >
          {submitting ? t("processing") : t("placeOrder")}
        </button>

        <p className="text-xs text-brand-gray text-center">
          {t("emailNote")}
        </p>
      </div>
    </div>
  );
}
