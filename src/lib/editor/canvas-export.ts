import type { CardType, CardFormat, WizardState } from "./wizard-state";
import { getCanvasDimensions } from "./canvas-dimensions";
import { fabricToWizardState } from "./fabric-to-wizard-state";
import { renderSpreadHTML } from "./card-to-html-v2";

/**
 * Export canvas pages data to a preview (WizardState + HTML).
 * Uses the shared PDF pipeline (card-to-html-v2.ts).
 */
export async function exportCanvasToPreview(
  pagesData: Record<string, string>,
  cardType: CardType,
  cardFormat: CardFormat,
  templateId: string
): Promise<{ wizardState: WizardState; previewHTML: string }> {
  const pageKeys = Object.keys(pagesData);
  if (pageKeys.length === 0) {
    throw new Error("Cannot export: no page data available");
  }

  const dims = getCanvasDimensions(cardType, cardFormat);

  // Multi-page templates (e.g. TI05) split content across pages: photo on
  // "front", text on "back".  We must merge text content from ALL pages so
  // that renderSpreadHTML (which iterates every template element regardless
  // of page) sees every field value.
  //
  // Strategy: convert each page independently, then merge non-empty
  // textContent fields + photo/background from the first page that has them.

  // Use the front page as the base state (photo, background, freeFormElements)
  const frontKey =
    pageKeys.find(k => k === "front") ??
    pageKeys.find(k => k.startsWith("front")) ??
    pageKeys[0];
  const frontJSON = pagesData[frontKey];

  const wizardState = fabricToWizardState(
    JSON.parse(frontJSON),
    dims,
    cardType,
    cardFormat,
    templateId
  );

  // Merge text content from other pages (back page, inside pages, etc.)
  for (const key of pageKeys) {
    if (key === frontKey) continue;
    const pageJSON = pagesData[key];
    if (!pageJSON) continue;

    const pageState = fabricToWizardState(
      JSON.parse(pageJSON),
      dims,
      cardType,
      cardFormat,
      templateId
    );

    // Copy non-empty text fields from this page into the merged state.
    // Skip formatting meta-fields (fontFamily, fontColor, textAlign, *FontSize).
    for (const [field, value] of Object.entries(pageState.textContent)) {
      if (typeof value !== "string" || !value) continue;
      if (field === "fontFamily" || field === "fontColor" || field === "textAlign") continue;
      const current = wizardState.textContent[field as keyof typeof wizardState.textContent];
      if (!current || current === "") {
        (wizardState.textContent as unknown as Record<string, unknown>)[field] = value;
      }
    }

    // If the front page has no photo but another page does, take it
    if (!wizardState.photo.url && pageState.photo.url) {
      wizardState.photo = pageState.photo;
    }
  }

  const previewHTML = await renderSpreadHTML(wizardState);

  return { wizardState, previewHTML };
}

/**
 * Export canvas to PDF via the existing server-side pipeline.
 * POSTs WizardState to /api/generate-pdf and returns the PDF blob.
 */
export async function exportCanvasToPDF(
  pagesData: Record<string, string>,
  cardType: CardType,
  cardFormat: CardFormat,
  templateId: string
): Promise<Blob> {
  const { wizardState } = await exportCanvasToPreview(
    pagesData,
    cardType,
    cardFormat,
    templateId
  );

  const response = await fetch("/api/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state: wizardState }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`PDF generation failed: ${(error as { error?: string }).error ?? response.status}`);
  }

  return response.blob();
}
