"use client";

import { useRef } from "react";

interface AddElementPanelProps {
  onAddText: () => void;
  onAddPhoto: (url: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function AddElementPanel({
  onAddText,
  onAddPhoto,
}: AddElementPanelProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert("Datei zu groß. Maximal 10MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Nur Bilddateien erlaubt (JPG, PNG, etc.).");
      return;
    }

    const url = URL.createObjectURL(file);
    onAddPhoto(url);

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-brand-gray">
        Elemente zum Kartendesign hinzufügen.
      </p>

      {/* Add Text */}
      <button
        onClick={onAddText}
        data-testid="add-text-btn"
        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-brand-border bg-white hover:border-brand-primary hover:shadow-sm transition-all text-sm text-brand-dark"
      >
        <span className="w-8 h-8 rounded bg-brand-primary-light flex items-center justify-center text-brand-primary text-lg">
          T
        </span>
        <div className="text-left">
          <div className="font-medium">Textfeld hinzufügen</div>
          <div className="text-[10px] text-brand-gray">Neues editierbares Textfeld</div>
        </div>
      </button>

      {/* Add Photo */}
      <button
        onClick={() => fileInputRef.current?.click()}
        data-testid="add-photo-btn"
        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-brand-border bg-white hover:border-brand-primary hover:shadow-sm transition-all text-sm text-brand-dark"
      >
        <span className="w-8 h-8 rounded bg-brand-primary-light flex items-center justify-center text-brand-primary text-lg">
          📷
        </span>
        <div className="text-left">
          <div className="font-medium">Foto hinzufügen</div>
          <div className="text-[10px] text-brand-gray">Bild hochladen (max 10MB)</div>
        </div>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <p className="text-[10px] text-brand-gray mt-4">
        Tipp: Elemente auf der Karte per Drag &amp; Drop verschieben und mit den Anfassern skalieren.
      </p>
    </div>
  );
}
