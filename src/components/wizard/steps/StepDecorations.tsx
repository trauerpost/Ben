"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { WizardState, WizardAction } from "@/lib/editor/wizard-state";
import type { Asset } from "@/lib/supabase/types";

interface StepDecorationsProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

type Tab = "border" | "ornament" | "symbol";

export default function StepDecorations({ state, dispatch }: StepDecorationsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("border");
  const [assets, setAssets] = useState<Record<Tab, Asset[]>>({
    border: [],
    ornament: [],
    symbol: [],
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
      setAssets({
        border: items.filter((a) => a.category === "border"),
        ornament: items.filter((a) => a.category === "ornament"),
        symbol: items.filter((a) => a.category === "symbol"),
      });
      setLoading(false);
    }
    fetchAssets();
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "border", label: "Borders" },
    { key: "ornament", label: "Corners" },
    { key: "symbol", label: "Dividers" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-light text-brand-dark text-center mb-3">
        Decorations
      </h2>
      <p className="text-brand-gray text-center mb-8">
        Add borders, corner ornaments, and dividers around your text. This step is optional.
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
        <p className="text-center text-brand-gray py-12">Loading decorations...</p>
      ) : assets[activeTab].length === 0 ? (
        <div className="text-center py-12">
          <p className="text-brand-gray mb-2">No {activeTab} decorations available yet.</p>
          <p className="text-xs text-brand-gray">Decorations will be added soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* None option */}
          <button
            onClick={() => {
              if (activeTab === "border") dispatch({ type: "SET_DECORATION_BORDER", id: null, url: null });
            }}
            className={`aspect-square rounded-xl border-2 flex items-center justify-center transition-all ${
              (activeTab === "border" && !state.decorations.borderId)
                ? "border-brand-primary bg-brand-primary-light"
                : "border-brand-border bg-brand-light-gray hover:border-brand-gray"
            }`}
          >
            <span className="text-sm text-brand-gray">None</span>
          </button>

          {assets[activeTab].map((asset) => {
            const isSelected =
              activeTab === "border"
                ? state.decorations.borderId === asset.id
                : activeTab === "ornament"
                ? state.decorations.cornerIds.includes(asset.id)
                : state.decorations.dividerIds.includes(asset.id);

            return (
              <button
                key={asset.id}
                onClick={() => {
                  if (activeTab === "border") {
                    dispatch({ type: "SET_DECORATION_BORDER", id: asset.id, url: asset.file_url });
                  } else if (activeTab === "ornament") {
                    const ids = isSelected
                      ? state.decorations.cornerIds.filter((id) => id !== asset.id)
                      : [...state.decorations.cornerIds, asset.id];
                    const urls = isSelected
                      ? state.decorations.cornerUrls.filter((_, i) => state.decorations.cornerIds[i] !== asset.id)
                      : [...state.decorations.cornerUrls, asset.file_url];
                    dispatch({ type: "SET_DECORATION_CORNERS", ids, urls });
                  } else {
                    const ids = isSelected
                      ? state.decorations.dividerIds.filter((id) => id !== asset.id)
                      : [...state.decorations.dividerIds, asset.id];
                    const urls = isSelected
                      ? state.decorations.dividerUrls.filter((_, i) => state.decorations.dividerIds[i] !== asset.id)
                      : [...state.decorations.dividerUrls, asset.file_url];
                    dispatch({ type: "SET_DECORATION_DIVIDERS", ids, urls });
                  }
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
                    <span className="text-white text-xs">✓</span>
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
