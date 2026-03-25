"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import CreatePromoModal from "./CreatePromoModal";
import type { PromoCode } from "@/lib/supabase/types";

interface PromoCodesClientProps {
  promoCodes: PromoCode[];
}

export default function PromoCodesClient({ promoCodes }: PromoCodesClientProps) {
  const t = useTranslations("admin.promoCodes");

  return (
    <div>
      <div className="flex justify-end mb-4">
        <CreatePromoModal />
      </div>

      {promoCodes.length === 0 ? (
        <p className="text-brand-gray text-sm">{t("noPromoCodes")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-brand-gray">
                <th className="py-3 px-2 font-medium">{t("code")}</th>
                <th className="py-3 px-2 font-medium">{t("type")}</th>
                <th className="py-3 px-2 font-medium">{t("value")}</th>
                <th className="py-3 px-2 font-medium">{t("uses")}</th>
                <th className="py-3 px-2 font-medium">{t("expires")}</th>
                <th className="py-3 px-2 font-medium">{t("active")}</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((pc) => (
                <tr key={pc.id} className="border-b border-brand-border hover:bg-brand-light-gray transition-colors">
                  <td className="py-3 px-2 font-mono font-medium">{pc.code}</td>
                  <td className="py-3 px-2">
                    {pc.discount_type === "percent" ? t("percent") : t("fixed")}
                  </td>
                  <td className="py-3 px-2">
                    {pc.discount_type === "percent"
                      ? `${pc.discount_value}%`
                      : `€${(pc.discount_value / 100).toFixed(2)}`}
                  </td>
                  <td className="py-3 px-2">
                    {pc.current_uses}/{pc.max_uses ?? "∞"}
                  </td>
                  <td className="py-3 px-2">
                    {pc.expires_at
                      ? new Date(pc.expires_at).toLocaleDateString("de-DE")
                      : "—"}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      pc.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {pc.is_active ? "✓" : "✗"}
                    </span>
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
