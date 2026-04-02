"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { WizardState, WizardAction } from "@/lib/editor/wizard-state";
import type { Asset } from "@/lib/supabase/types";

interface StepDecorationsProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

type Tab = "symbol" | "border";

export default function StepDecorations({ state, dispatch }: StepDecorationsProps) {
  const t = useTranslations("wizard.decorations");
  const [activeTab, setActiveTab] = useState<Tab>("symbol");
  const [assets, setAssets] = useState<Record<Tab, Asset[]>>({
    symbol: [],
    border: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssets() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("assets")
        .select("*")
        .in("category", ["border", "ornament", "symbol"])
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      const items = (data as Asset[]) ?? [];

      // Filter out horizontal dividers from the decoration picker —
      // they're meant for template-level placement between text sections,
      // not for the bottom-right corner decoration slot.
      const isCornerOrnament = (a: Asset): boolean => {
        const url = a.file_url;
        const vbMatch = url.match(/viewBox='(\d+)\s+(\d+)\s+(\d+)\s+(\d+)'/);
        if (vbMatch) {
          const w = parseInt(vbMatch[3], 10);
          const h = parseInt(vbMatch[4], 10);
          if (h > 0 && w / h > 2.5) return false; // Wide divider — filter out
        }
        return true;
      };

      setAssets({
        symbol: items
          .filter((a) => a.category === "symbol" || a.category === "ornament")
          .filter(isCornerOrnament),
        border: items.filter((a) => a.category === "border"),
      });
      setLoading(false);
    }
    fetchAssets();
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "symbol", label: t("tabSymbols") },
    { key: "border", label: t("tabBorders") },
  ];

  function handleSelectSymbol(asset: Asset | null) {
    dispatch({
      type: "SET_DECORATION",
      assetId: asset?.id ?? null,
      assetUrl: asset ? (asset.file_url) : null,
    });
  }

  function handleSelectBorder(asset: Asset | null) {
    dispatch({
      type: "SET_BORDER",
      id: asset?.id ?? null,
      url: asset ? (asset.file_url) : null,
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h2 className="text-3xl font-light text-brand-dark text-center mb-3">
        {t("title")}
      </h2>
      <p className="text-brand-gray text-center mb-8">
        {t("subtitle")}
      </p>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-brand-primary text-white"
                : "bg-brand-light-gray text-brand-gray hover:text-brand-dark"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-brand-gray py-12">{t("loading")}</p>
      ) : assets[activeTab].length === 0 ? (
        <div className="text-center py-12">
          <p className="text-brand-gray mb-2">{t("empty")}</p>
          <p className="text-xs text-brand-gray">{t("comingSoon")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* None option */}
          <button
            onClick={() => {
              if (activeTab === "border") handleSelectBorder(null);
              else handleSelectSymbol(null);
            }}
            className={`aspect-square rounded-xl border-2 flex items-center justify-center transition-all ${
              (activeTab === "border" && !state.border.id) ||
              (activeTab === "symbol" && !state.decoration.assetId)
                ? "border-brand-primary bg-brand-primary-light"
                : "border-brand-border bg-brand-light-gray hover:border-brand-gray"
            }`}
          >
            <span className="text-sm text-brand-gray">{t("none")}</span>
          </button>

          {assets[activeTab].map((asset) => {
            const isSelected =
              activeTab === "border"
                ? state.border.id === asset.id
                : state.decoration.assetId === asset.id;

            return (
              <button
                key={asset.id}
                onClick={() => {
                  if (activeTab === "border") handleSelectBorder(asset);
                  else handleSelectSymbol(asset);
                }}
                className={`relative aspect-square rounded-xl border-2 overflow-hidden transition-all hover:shadow-md ${
                  isSelected
                    ? "border-brand-primary ring-2 ring-brand-primary/30"
                    : "border-brand-border hover:border-brand-gray"
                }`}
              >
                <Image
                  src={asset.thumbnail_url || asset.file_url}
                  alt={asset.name}
                  fill
                  className="object-contain p-2"
                />
                {isSelected && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center">
                    <span className="text-white text-xs">&#10003;</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
