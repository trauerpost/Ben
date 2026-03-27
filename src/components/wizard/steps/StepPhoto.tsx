"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import AvatarEditor from "react-avatar-editor";
import type { AvatarEditorRef } from "react-avatar-editor";
import type { WizardState, WizardAction } from "@/lib/editor/wizard-state";
import { getTemplateConfig } from "@/lib/editor/template-configs";

interface StepPhotoProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

/** Compute the photo slot aspect ratio from the template config's grid + physical dimensions. */
function getPhotoSlotAspect(state: WizardState): number {
  const config = state.templateId ? getTemplateConfig(state.templateId) : null;
  if (!config) return 3 / 4; // default portrait

  const photoEl = config.elements.find(
    (el) => el.type === "image" && el.field === "photo"
  );
  if (!photoEl) return 3 / 4;

  // Grid is 1000×1000 but physically spreadWidthMm × spreadHeightMm
  const physicalW = (photoEl.w / 1000) * config.spreadWidthMm;
  const physicalH = (photoEl.h / 1000) * config.spreadHeightMm;
  return physicalW / physicalH;
}

/** Max canvas display size that fits in the container */
const MAX_CANVAS_W = 360;
const MAX_CANVAS_H = 400;

export default function StepPhoto({ state, dispatch }: StepPhotoProps) {
  const editorRef = useRef<AvatarEditorRef | null>(null);
  const [zoom, setZoom] = useState(1.2);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate canvas dimensions from template photo slot aspect ratio
  const { canvasW, canvasH } = useMemo(() => {
    const aspect = getPhotoSlotAspect(state);
    let w = MAX_CANVAS_W;
    let h = w / aspect;
    if (h > MAX_CANVAS_H) {
      h = MAX_CANVAS_H;
      w = h * aspect;
    }
    return { canvasW: Math.round(w), canvasH: Math.round(h) };
  }, [state]);

  const syncCrop = useCallback(() => {
    if (!editorRef.current) return;
    const rect = editorRef.current.getCroppingRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      dispatch({ type: "SET_PHOTO_CROP", crop: rect });
    }
  }, [dispatch]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum 10MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    dispatch({ type: "SET_PHOTO", url });
    // Reset zoom when new photo uploaded
    setZoom(1.2);
  }

  function handleRemove() {
    dispatch({ type: "SET_PHOTO", url: "" });
    dispatch({ type: "SET_PHOTO_CROP", crop: null });
    setZoom(1.2);
  }

  const templateConfig = state.templateId
    ? getTemplateConfig(state.templateId)
    : null;
  const photoClip = templateConfig?.elements.find(
    (el) => el.type === "image" && el.field === "photo"
  )?.imageClip;

  // Border radius for ellipse clip (TI08)
  const borderRadius = photoClip === "ellipse" ? canvasW / 2 : 0;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-light text-brand-dark text-center mb-3">
        Photo
      </h2>
      <p className="text-brand-gray text-center mb-10">
        Upload a photo and adjust the crop area. Drag to reposition, use the
        slider to zoom.
      </p>

      <div className="flex flex-col items-center gap-6">
        {state.photo.url ? (
          <>
            {/* Crop Editor */}
            <div
              className="relative rounded-xl overflow-hidden shadow-lg border border-brand-border bg-gray-100"
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
            >
              <AvatarEditor
                ref={editorRef}
                image={state.photo.url}
                width={canvasW}
                height={canvasH}
                border={30}
                borderRadius={borderRadius}
                scale={zoom}
                color={[0, 0, 0, 0.4]}
                backgroundColor="#f5f5f5"
                onMouseUp={() => {
                  setIsDragging(false);
                  syncCrop();
                }}
                onMouseMove={() => setIsDragging(true)}
                onImageReady={syncCrop}
                onImageChange={syncCrop}
              />
            </div>

            {/* Zoom Slider */}
            <div className="w-full max-w-xs flex items-center gap-3">
              <svg
                className="w-4 h-4 text-brand-gray shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                />
              </svg>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => {
                  setZoom(parseFloat(e.target.value));
                  // Sync after zoom change — debounced by onImageChange
                }}
                className="flex-1 accent-brand-primary"
              />
              <svg
                className="w-4 h-4 text-brand-gray shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                />
              </svg>
            </div>

            {/* Zoom percentage display */}
            <span className="text-xs text-brand-gray">
              Zoom: {Math.round(zoom * 100)}%
            </span>

            {/* Action buttons */}
            <div className="flex gap-3">
              <label className="px-4 py-2 text-sm rounded-lg border border-brand-border text-brand-gray hover:bg-brand-light-gray transition-colors cursor-pointer">
                Replace Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleRemove}
                className="px-4 py-2 text-sm rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          /* Upload area */
          <label className="w-72 h-80 rounded-xl border-2 border-dashed border-brand-border hover:border-brand-primary flex flex-col items-center justify-center cursor-pointer transition-colors bg-brand-light-gray">
            <svg
              className="w-12 h-12 text-brand-gray mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm text-brand-gray font-medium">
              Click to upload photo
            </span>
            <span className="text-xs text-brand-gray mt-1">
              JPG, PNG — max 10 MB
            </span>
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
