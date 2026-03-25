"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

interface AddCreditsModalProps {
  customerId: string;
  customerName: string;
}

export default function AddCreditsModal({ customerId, customerName }: AddCreditsModalProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("admin.customers");

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError("");
    setLoading(true);

    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0) {
      setError("Amount must be a positive number");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/customers/${customerId}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount, description }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("creditsFailed"));
        setLoading(false);
        return;
      }

      setOpen(false);
      setAmount("");
      setDescription("");
      router.refresh();
    } catch {
      setError(t("creditsFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-brand-primary text-white text-sm rounded-lg hover:bg-brand-primary-hover transition-colors"
      >
        {t("addCredits")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-medium text-brand-dark mb-4">
              {t("addCredits")} — {customerName}
            </h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">
                  {t("amount")}
                </label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">
                  {t("description")}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setError(""); }}
                  className="px-4 py-2 text-sm text-brand-gray hover:text-brand-dark transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-brand-primary text-white text-sm rounded-lg hover:bg-brand-primary-hover transition-colors disabled:opacity-50"
                >
                  {loading ? "..." : t("addCredits")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
