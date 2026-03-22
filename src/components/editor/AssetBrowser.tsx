"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Asset } from "@/lib/supabase/types";

const assetCategories = [
  "all",
  "background",
  "border",
  "symbol",
  "icon",
  "ornament",
  "photo_frame",
] as const;

interface AssetBrowserProps {
  onSelect: (asset: Asset) => void;
}

export default function AssetBrowser({ onSelect }: AssetBrowserProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssets() {
      setLoading(true);
      const supabase = createClient();
      let query = supabase
        .from("assets")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (category !== "all") {
        query = query.eq("category", category);
      }

      const { data } = await query;
      setAssets((data as Asset[]) ?? []);
      setLoading(false);
    }

    fetchAssets();
  }, [category]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 flex-wrap p-3 border-b border-brand-border">
        {assetCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              category === cat
                ? "bg-brand-primary text-white"
                : "bg-brand-light-gray text-brand-gray hover:text-brand-dark"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <p className="text-sm text-brand-gray text-center py-8">Loading...</p>
        ) : assets.length === 0 ? (
          <p className="text-sm text-brand-gray text-center py-8">
            No assets found.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {assets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => onSelect(asset)}
                className="relative aspect-square rounded-lg overflow-hidden border border-brand-border hover:border-brand-primary transition-colors bg-brand-light-gray"
              >
                {asset.thumbnail_url || asset.file_url ? (
                  <Image
                    src={asset.thumbnail_url || asset.file_url}
                    alt={asset.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xs text-brand-gray flex items-center justify-center h-full">
                    {asset.name}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
