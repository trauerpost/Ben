import type { CardType, CardFormat, WizardState } from "./wizard-state";
import { getCanvasDimensions } from "./canvas-dimensions";
import { fabricToWizardState } from "./fabric-to-wizard-state";

/**
 * Convert canvas pages data to a merged WizardState.
 * Merges text content from ALL pages so that both front and back fields are populated.
 * Safe to call from browser (no Node.js APIs).
 */
export function exportCanvasToWizardState(
  pagesData: Record<string, string>,
  cardType: CardType,
  cardFormat: CardFormat,
  templateId: string
): WizardState {
  const pageKeys = Object.keys(pagesData);
  if (pageKeys.length === 0) {
    throw new Error("Cannot export: no page data available");
  }

  const dims = getCanvasDimensions(cardType, cardFormat);

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
    for (const [field, value] of Object.entries(pageState.textContent)) {
      if (typeof value !== "string" || !value) continue;
      if (field === "fontColor" || field === "textAlign") continue;
      const current = wizardState.textContent[field as keyof typeof wizardState.textContent];
      if (!current || current === "") {
        (wizardState.textContent as unknown as Record<string, unknown>)[field] = value;
      }
    }

    // Merge per-element overrides from other pages
    if (pageState.elementOverrides) {
      wizardState.elementOverrides = {
        ...(wizardState.elementOverrides ?? {}),
        ...pageState.elementOverrides,
      };
    }

    // Cover photo goes to separate field; inner pages can adopt photo normally
    if (key === "outside-spread") {
      if (pageState.photo.url) {
        wizardState.coverPhoto = { url: pageState.photo.url };
      }
    } else if (!wizardState.photo.url && pageState.photo.url) {
      wizardState.photo = pageState.photo;
    }
  }

  return wizardState;
}

/** @deprecated Use exportCanvasToWizardState + /api/preview instead */
export async function exportCanvasToPreview(
  pagesData: Record<string, string>,
  cardType: CardType,
  cardFormat: CardFormat,
  templateId: string
): Promise<{ wizardState: WizardState; previewHTML: string }> {
  const wizardState = exportCanvasToWizardState(pagesData, cardType, cardFormat, templateId);
  const { renderSpreadHTML } = await import("./card-to-html-v2");
  const previewHTML = await renderSpreadHTML(wizardState);
  return { wizardState, previewHTML };
}

/**
 * Export canvas pages directly to PDF as a single spread.
 * The full card (e.g. 140×105mm) is one PDF page with front on the left
 * and back on the right, each 70×105mm. No server-side rendering needed.
 */
export async function exportCanvasToPDF(
  pageImages: Record<string, string>,
  cardType: CardType,
  cardFormat: CardFormat,
  _templateId: string
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");

  const config = (await import("./wizard-state")).CARD_CONFIGS[cardType];
  const format = config?.formats[cardFormat];
  if (!format) throw new Error(`Unknown card format: ${cardType}/${cardFormat}`);

  const spreadW = format.widthMm;   // 140mm
  const spreadH = format.heightMm;  // 105mm
  const halfW = spreadW / 2;        // 70mm per side

  const pageKeys = Object.keys(pageImages);
  if (pageKeys.length === 0) throw new Error("No page images provided");

  // Sort: "front" first, "back" second
  const sorted = pageKeys.sort((a, b) => {
    if (a === "front") return -1;
    if (b === "front") return 1;
    return a.localeCompare(b);
  });

  const hasOutsideSpread = sorted.includes("outside-spread");

  const pdf = new jsPDF({
    orientation: spreadW > spreadH ? "landscape" : "portrait",
    unit: "mm",
    format: [spreadW, spreadH],
  });

  if (hasOutsideSpread) {
    // Folded card: Page 1 = outside spread (full width), Pages 2-3 = inner pages (portrait)
    const outsideImg = pageImages["outside-spread"];
    if (outsideImg) {
      pdf.addImage(outsideImg, "PNG", 0, 0, spreadW, spreadH);
    }

    // Pages 2-3: each inner page as separate portrait page (70x105mm)
    const innerKeys = sorted.filter(k => k !== "outside-spread");
    for (const key of innerKeys) {
      const imgData = pageImages[key];
      if (!imgData) continue;
      pdf.addPage([halfW, spreadH], "portrait");
      pdf.addImage(imgData, "PNG", 0, 0, halfW, spreadH);
    }
  } else {
    // Standard card: place all pages side by side on one PDF page
    for (let i = 0; i < sorted.length; i++) {
      const imgData = pageImages[sorted[i]];
      if (!imgData) continue;
      pdf.addImage(imgData, "PNG", i * halfW, 0, halfW, spreadH);
    }
  }

  return pdf.output("blob");
}
