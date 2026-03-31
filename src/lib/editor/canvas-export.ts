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

  // Use the first page (front) as the primary content
  const frontKey = pageKeys[0];
  const frontJSON = pagesData[frontKey];

  const wizardState = fabricToWizardState(
    JSON.parse(frontJSON),
    dims,
    cardType,
    cardFormat,
    templateId
  );

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
