"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function CreatePromoModal() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("admin.promoCodes");

  function generateCode(): void {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discount_type: discountType,
          discount_value: parseInt(discountValue, 10),
          max_uses: maxUses ? parseInt(maxUses, 10) : null,
          expires_at: expiresAt || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create promo code");
        setLoading(false);
        return;
      }

      setOpen(false);
      setCode("");
      setDiscountValue("");
      setMaxUses("");
      setExpiresAt("");
      router.refresh();
    } catch {
      setError("Failed to create promo code");
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
        {t("createCode")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-medium text-brand-dark mb-4">{t("createCode")}</h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">{t("code")}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-3 py-2 text-xs border border-brand-border rounded-lg hover:bg-brand-light-gray transition-colors"
                  >
                    {t("autoGenerate")}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">{t("type")}</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg"
                  >
                    <option value="percent">{t("percent")}</option>
                    <option value="fixed">{t("fixed")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">{t("value")}</label>
                  <input
                    type="number"
                    min="1"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">{t("maxUses")}</label>
                  <input
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg"
                    placeholder="∞"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">{t("expiryDate")}</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg"
                  />
                </div>
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
                  {loading ? "..." : t("confirm")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
