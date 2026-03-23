"use client";

import Image from "next/image";
import type { WizardState, WizardAction } from "@/lib/editor/wizard-state";

interface StepPhotoProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

export default function StepPhoto({ state, dispatch }: StepPhotoProps) {
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum 10MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    dispatch({ type: "SET_PHOTO", url });
  }

  function handleRemove() {
    dispatch({ type: "SET_PHOTO", url: "" });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-light text-brand-dark text-center mb-3">
        Upload Photo
      </h2>
      <p className="text-brand-gray text-center mb-10">
        Add a photo of the deceased. This will appear on the inside left of the card.
      </p>

      <div className="flex flex-col items-center gap-8">
        {state.photoUrl ? (
          <div className="relative">
            <div className="w-64 h-80 rounded-xl overflow-hidden shadow-lg border border-brand-border">
              <Image
                src={state.photoUrl}
                alt="Uploaded photo"
                fill
                className="object-cover"
              />
            </div>
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          </div>
        ) : (
          <label className="w-64 h-80 rounded-xl border-2 border-dashed border-brand-border hover:border-brand-primary flex flex-col items-center justify-center cursor-pointer transition-colors bg-brand-light-gray">
            <svg className="w-12 h-12 text-brand-gray mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-brand-gray">Click to upload photo</span>
            <span className="text-xs text-brand-gray mt-1">Max 10MB</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}

        <p className="text-xs text-brand-gray">
          This step is optional — you can skip it if no photo is needed.
        </p>
      </div>
    </div>
  );
}
