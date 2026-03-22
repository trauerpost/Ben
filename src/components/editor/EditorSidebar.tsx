"use client";

import { useState } from "react";
import AssetBrowser from "./AssetBrowser";
import type { Asset } from "@/lib/supabase/types";

interface EditorSidebarProps {
  onAssetSelect: (asset: Asset) => void;
  onImageUpload: (url: string) => void;
}

type Tab = "assets" | "upload";

export default function EditorSidebar({
  onAssetSelect,
  onImageUpload,
}: EditorSidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>("assets");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum 10MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    onImageUpload(url);
  }

  return (
    <div className="w-72 border-l border-brand-border bg-white flex flex-col h-full">
      <div className="flex border-b border-brand-border">
        <button
          onClick={() => setActiveTab("assets")}
          className={`flex-1 px-4 py-3 text-sm transition-colors ${
            activeTab === "assets"
              ? "text-brand-primary border-b-2 border-brand-primary font-medium"
              : "text-brand-gray hover:text-brand-dark"
          }`}
        >
          Assets
        </button>
        <button
          onClick={() => setActiveTab("upload")}
          className={`flex-1 px-4 py-3 text-sm transition-colors ${
            activeTab === "upload"
              ? "text-brand-primary border-b-2 border-brand-primary font-medium"
              : "text-brand-gray hover:text-brand-dark"
          }`}
        >
          Upload
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "assets" ? (
          <AssetBrowser onSelect={onAssetSelect} />
        ) : (
          <div className="p-4">
            <label className="block">
              <span className="text-sm text-brand-gray mb-2 block">
                Upload a photo (max 10MB)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-brand-gray file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-primary-light file:text-brand-primary hover:file:bg-brand-primary hover:file:text-white file:transition-colors file:cursor-pointer"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
