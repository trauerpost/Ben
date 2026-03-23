"use client";

import { useState } from "react";
import Image from "next/image";
import type { WizardState, WizardAction } from "@/lib/editor/wizard-state";

interface BackgroundImage {
  id: string;
  name: string;
  thumb: string;
  full: string;
  tags: string[];
}

// Static backgrounds — no DB query, instant load
const BACKGROUNDS: BackgroundImage[] = [
  { id: "1", name: "Mountain Sunrise", thumb: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=60", full: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", tags: ["mountain", "sunrise"] },
  { id: "2", name: "Forest Path", thumb: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&q=60", full: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80", tags: ["forest", "green"] },
  { id: "3", name: "Ocean Sunset", thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&q=60", full: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80", tags: ["ocean", "sunset"] },
  { id: "4", name: "Misty Lake", thumb: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=300&q=60", full: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80", tags: ["lake", "mist"] },
  { id: "5", name: "Snow Peaks", thumb: "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=300&q=60", full: "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=800&q=80", tags: ["mountain", "snow"] },
  { id: "6", name: "Lavender Field", thumb: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=300&q=60", full: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=800&q=80", tags: ["flowers", "purple"] },
  { id: "7", name: "Calm River", thumb: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&q=60", full: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80", tags: ["river", "calm"] },
  { id: "8", name: "Golden Meadow", thumb: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=300&q=60", full: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80", tags: ["meadow", "golden"] },
  { id: "9", name: "Cherry Blossoms", thumb: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=300&q=60", full: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&q=80", tags: ["flowers", "spring"] },
  { id: "10", name: "Starry Night", thumb: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&q=60", full: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80", tags: ["stars", "night"] },
  { id: "11", name: "Green Valley", thumb: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=300&q=60", full: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80", tags: ["valley", "green"] },
  { id: "12", name: "Sunflower Field", thumb: "https://images.unsplash.com/photo-1474557157379-8aa74a6ef541?w=300&q=60", full: "https://images.unsplash.com/photo-1474557157379-8aa74a6ef541?w=800&q=80", tags: ["flowers", "yellow"] },
  { id: "13", name: "Peaceful Garden", thumb: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=300&q=60", full: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80", tags: ["garden", "peaceful"] },
  { id: "14", name: "Waterfall", thumb: "https://images.unsplash.com/photo-1432405972618-c6b0cfba858e?w=300&q=60", full: "https://images.unsplash.com/photo-1432405972618-c6b0cfba858e?w=800&q=80", tags: ["waterfall", "green"] },
  { id: "15", name: "Cloudy Sky", thumb: "https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=300&q=60", full: "https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=800&q=80", tags: ["sky", "clouds"] },
  { id: "16", name: "Olive Grove", thumb: "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=300&q=60", full: "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800&q=80", tags: ["trees", "mediterranean"] },
  { id: "17", name: "Morning Dew", thumb: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=300&q=60", full: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=800&q=80", tags: ["dew", "morning"] },
  { id: "18", name: "Birch Forest", thumb: "https://images.unsplash.com/photo-1440581572325-0bea30075d9d?w=300&q=60", full: "https://images.unsplash.com/photo-1440581572325-0bea30075d9d?w=800&q=80", tags: ["forest", "birch"] },
  { id: "19", name: "Rose Garden", thumb: "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=300&q=60", full: "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=800&q=80", tags: ["flowers", "roses"] },
  { id: "20", name: "Autumn Leaves", thumb: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=60", full: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80", tags: ["autumn", "warm"] },
];

const INITIAL_SHOW = 5;

interface StepBackImageProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  initialAssets?: unknown[];
}

export default function StepBackImage({ state, dispatch }: StepBackImageProps) {
  const [activeTag, setActiveTag] = useState<string>("all");
  const [showAll, setShowAll] = useState(false);

  const allTags = Array.from(new Set(BACKGROUNDS.flatMap((b) => b.tags))).sort();

  const filtered =
    activeTag === "all"
      ? BACKGROUNDS
      : BACKGROUNDS.filter((b) => b.tags.includes(activeTag));

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_SHOW);
  const hasMore = filtered.length > INITIAL_SHOW && !showAll;

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
          onClick={() => { setActiveTag("all"); setShowAll(false); }}
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
            onClick={() => { setActiveTag(tag); setShowAll(false); }}
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {visible.map((bg) => {
          const isSelected = state.backImageUrl === bg.full;
          return (
            <button
              key={bg.id}
              onClick={() => dispatch({ type: "SET_BACK_IMAGE", url: bg.full })}
              className={`relative aspect-[3/4] rounded-xl overflow-hidden border-3 transition-all hover:shadow-lg ${
                isSelected
                  ? "border-brand-primary shadow-md ring-2 ring-brand-primary/30"
                  : "border-transparent hover:border-brand-gray"
              }`}
            >
              <Image
                src={bg.thumb}
                alt={bg.name}
                fill
                sizes="(max-width: 768px) 45vw, 20vw"
                className="object-cover"
                loading="lazy"
              />
              {isSelected && (
                <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center shadow">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <span className="text-white text-xs">{bg.name}</span>
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

      {/* Show more button */}
      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={() => setShowAll(true)}
            className="px-6 py-2.5 rounded-lg text-sm font-medium bg-brand-light-gray text-brand-gray hover:text-brand-dark hover:bg-brand-border transition-colors"
          >
            Show all {filtered.length} backgrounds
          </button>
        </div>
      )}
    </div>
  );
}
