"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import type { WizardState, WizardAction } from "@/lib/editor/wizard-state";
import type { Asset } from "@/lib/supabase/types";

interface StepBackImageProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  initialAssets?: Asset[];
}

export default function StepBackImage({ state, dispatch, initialAssets = [] }: StepBackImageProps) {
  const [activeTag, setActiveTag] = useState<string>("all");

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    initialAssets.forEach((a) => a.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [initialAssets]);

  const filtered =
    activeTag === "all"
      ? initialAssets
      : initialAssets.filter((a) => a.tags.includes(activeTag));

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum 10MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    dispatch({ type: "SET_BACK_IMAGE", url });
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-light text-brand-dark text-center mb-3">
        Choose Background
      </h2>
      <p className="text-brand-gray text-center mb-8">
        This image will be the back of your card.
      </p>

      {/* Tag filters */}
      <div className="flex gap-2 flex-wrap justify-center mb-8">
        <button
          onClick={() => setActiveTag("all")}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            activeTag === "all"
              ? "bg-brand-primary text-white"
              : "bg-brand-light-gray text-brand-gray hover:text-brand-dark"
          }`}
        >
          All
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
              activeTag === tag
                ? "bg-brand-primary text-white"
                : "bg-brand-light-gray text-brand-gray hover:text-brand-dark"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((asset) => {
          const isSelected = state.backImageUrl === asset.file_url;
          return (
            <button
              key={asset.id}
              onClick={() => dispatch({ type: "SET_BACK_IMAGE", url: asset.file_url })}
              className={`relative aspect-[3/4] rounded-xl overflow-hidden border-3 transition-all hover:shadow-lg ${
                isSelected
                  ? "border-brand-primary shadow-md ring-2 ring-brand-primary/30"
                  : "border-transparent hover:border-brand-gray"
              }`}
            >
              <Image
                src={asset.file_url}
                alt={asset.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />
              {isSelected && (
                <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center shadow">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <span className="text-white text-xs">{asset.name}</span>
              </div>
            </button>
          );
        })}

        {/* Upload custom */}
        <label className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-dashed border-brand-border hover:border-brand-primary flex items-center justify-center cursor-pointer transition-colors bg-brand-light-gray">
          <div className="text-center">
            <span className="text-3xl text-brand-gray">+</span>
            <p className="text-xs text-brand-gray mt-2">Upload your own</p>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
