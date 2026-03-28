"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";

interface BackgroundRemoverProps {
  photoUrl: string;
  onResult: (resultUrl: string, mode: "removed" | "blurred") => void;
  onRestore: () => void;
  isProcessed: boolean;
}

type ProcessingStatus =
  | "idle"
  | "downloading-model"
  | "processing"
  | "done"
  | "error";

/**
 * Composite the subject (from segmentation mask) onto a white background
 * using Canvas 2D.
 */
async function compositeOnWhite(
  originalUrl: string,
  maskBlob: Blob
): Promise<string> {
  const [origImg, maskImg] = await Promise.all([
    loadImage(originalUrl),
    loadImage(URL.createObjectURL(maskBlob)),
  ]);

  const w = origImg.width;
  const h = origImg.height;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  // Draw mask as alpha — mask is grayscale where white = subject
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = w;
  maskCanvas.height = h;
  const maskCtx = maskCanvas.getContext("2d")!;
  maskCtx.drawImage(maskImg, 0, 0, w, h);
  const maskData = maskCtx.getImageData(0, 0, w, h);

  // Draw original
  const origCanvas = document.createElement("canvas");
  origCanvas.width = w;
  origCanvas.height = h;
  const origCtx = origCanvas.getContext("2d")!;
  origCtx.drawImage(origImg, 0, 0);
  const origData = origCtx.getImageData(0, 0, w, h);

  // Apply mask alpha to original
  for (let i = 0; i < origData.data.length; i += 4) {
    origData.data[i + 3] = maskData.data[i]; // R channel of mask as alpha
  }
  origCtx.putImageData(origData, 0, 0);

  // Composite masked subject onto white
  ctx.drawImage(origCanvas, 0, 0);

  return canvas.toDataURL("image/png");
}

/**
 * Composite: blurred full image as background, sharp subject on top.
 */
async function compositeBlurred(
  originalUrl: string,
  maskBlob: Blob
): Promise<string> {
  const [origImg, maskImg] = await Promise.all([
    loadImage(originalUrl),
    loadImage(URL.createObjectURL(maskBlob)),
  ]);

  const w = origImg.width;
  const h = origImg.height;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Draw blurred background
  ctx.filter = "blur(8px)";
  ctx.drawImage(origImg, 0, 0);
  ctx.filter = "none";

  // Create masked subject (sharp)
  const subjectCanvas = document.createElement("canvas");
  subjectCanvas.width = w;
  subjectCanvas.height = h;
  const subjectCtx = subjectCanvas.getContext("2d")!;

  // Draw mask to get mask data
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = w;
  maskCanvas.height = h;
  const maskCtx = maskCanvas.getContext("2d")!;
  maskCtx.drawImage(maskImg, 0, 0, w, h);
  const maskData = maskCtx.getImageData(0, 0, w, h);

  // Draw original and apply mask
  subjectCtx.drawImage(origImg, 0, 0);
  const subjectData = subjectCtx.getImageData(0, 0, w, h);

  for (let i = 0; i < subjectData.data.length; i += 4) {
    subjectData.data[i + 3] = maskData.data[i];
  }
  subjectCtx.putImageData(subjectData, 0, 0);

  // Draw sharp subject on top of blurred background
  ctx.drawImage(subjectCanvas, 0, 0);

  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export default function BackgroundRemover({
  photoUrl,
  onResult,
  onRestore,
  isProcessed,
}: BackgroundRemoverProps) {
  const t = useTranslations("wizard.photo");
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const segmenterRef = useRef<ReturnType<typeof Object> | null>(null);

  const getSegmenter = useCallback(async () => {
    if (segmenterRef.current) return segmenterRef.current;

    setStatus("downloading-model");
    setProgress(10);

    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false;

    setProgress(30);

    let device: "webgpu" | "wasm" = "webgpu";
    try {
      // Check WebGPU availability
      const nav = navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown | null> } };
      if (!nav.gpu) {
        device = "wasm";
      } else {
        const adapter = await nav.gpu.requestAdapter();
        if (!adapter) device = "wasm";
      }
    } catch {
      device = "wasm";
    }

    const segmenter = await pipeline(
      "image-segmentation",
      "briaai/RMBG-1.4",
      {
        device,
        dtype: "q8" as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        progress_callback: (p: any) => {
          if (p?.progress != null) {
            setProgress(30 + Math.round(p.progress * 0.5));
          }
        },
      }
    );

    segmenterRef.current = segmenter;
    setProgress(80);
    return segmenter;
  }, []);

  const handleProcess = useCallback(
    async (mode: "removed" | "blurred") => {
      setError(null);
      setProgress(0);

      try {
        const segmenter = await getSegmenter();
        setStatus("processing");
        setProgress(85);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results: any[] = await segmenter(photoUrl);

        if (!results || results.length === 0) {
          throw new Error("Segmentation returned no results");
        }

        setProgress(90);

        // result[0].mask is a RawImage — convert to blob
        const maskBlob: Blob = await results[0].mask.toBlob();

        let resultUrl: string;
        if (mode === "removed") {
          resultUrl = await compositeOnWhite(photoUrl, maskBlob);
        } else {
          resultUrl = await compositeBlurred(photoUrl, maskBlob);
        }

        setProgress(100);
        setStatus("done");
        onResult(resultUrl, mode);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Background processing failed";
        setError(message);
        setStatus("error");
      }
    },
    [photoUrl, getSegmenter, onResult]
  );

  const statusLabel =
    status === "downloading-model"
      ? t("downloadingModel")
      : status === "processing"
        ? t("processing")
        : null;

  const isWorking = status === "downloading-model" || status === "processing";

  return (
    <div className="flex flex-col gap-3">
      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleProcess("removed")}
          disabled={isWorking}
          className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("removeBackground")}
        </button>

        <button
          type="button"
          onClick={() => handleProcess("blurred")}
          disabled={isWorking}
          className="flex-1 rounded-lg bg-slate-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("blurBackground")}
        </button>
      </div>

      {/* Restore button */}
      {isProcessed && !isWorking && (
        <button
          type="button"
          onClick={onRestore}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          {t("restoreOriginal")}
        </button>
      )}

      {/* Progress bar */}
      {isWorking && (
        <div className="flex flex-col gap-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {statusLabel && (
            <p className="text-center text-xs text-slate-500">{statusLabel}</p>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
