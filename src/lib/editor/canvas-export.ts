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
    // Folded card on A4 (210×297mm) — outside on top, inside on bottom, centered with crop marks
    const a4W = 210;
    const a4H = 297;
    const gap = 10; // mm between cards
    const marginX = (a4W - spreadW) / 2;   // (210-140)/2 = 35mm
    const totalContentH = spreadH * 2 + gap; // 105+105+10 = 220mm
    const marginY = (a4H - totalContentH) / 2; // (297-220)/2 = 38.5mm
    const topCardY = marginY;
    const botCardY = marginY + spreadH + gap;
    const cropLen = 5;
    const cropOff = 3;

    const foldedPdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Outside spread (top)
    const outsideImg = pageImages["outside-spread"];
    if (outsideImg) {
      foldedPdf.addImage(outsideImg, "PNG", marginX, topCardY, spreadW, spreadH);
    }

    // Inside spread (bottom) — front left + back right
    const innerKeys = sorted.filter(k => k !== "outside-spread");
    for (let i = 0; i < innerKeys.length; i++) {
      const imgData = pageImages[innerKeys[i]];
      if (!imgData) continue;
      foldedPdf.addImage(imgData, "PNG", marginX + i * halfW, botCardY, halfW, spreadH);
    }

    // Crop marks + labels
    foldedPdf.setDrawColor(128, 128, 128);
    foldedPdf.setLineWidth(0.2);
    foldedPdf.setFontSize(6);
    foldedPdf.setTextColor(128, 128, 128);

    for (const { x, y, label } of [
      { x: marginX, y: topCardY, label: "Außenseite (Outside)" },
      { x: marginX, y: botCardY, label: "Innenseite (Inside)" },
    ]) {
      // Corner crop marks (top-left, top-right, bottom-left, bottom-right)
      // Top-left
      foldedPdf.line(x - cropOff - cropLen, y, x - cropOff, y);
      foldedPdf.line(x, y - cropOff - cropLen, x, y - cropOff);
      // Top-right
      foldedPdf.line(x + spreadW + cropOff, y, x + spreadW + cropOff + cropLen, y);
      foldedPdf.line(x + spreadW, y - cropOff - cropLen, x + spreadW, y - cropOff);
      // Bottom-left
      foldedPdf.line(x - cropOff - cropLen, y + spreadH, x - cropOff, y + spreadH);
      foldedPdf.line(x, y + spreadH + cropOff, x, y + spreadH + cropOff + cropLen);
      // Bottom-right
      foldedPdf.line(x + spreadW + cropOff, y + spreadH, x + spreadW + cropOff + cropLen, y + spreadH);
      foldedPdf.line(x + spreadW, y + spreadH + cropOff, x + spreadW, y + spreadH + cropOff + cropLen);
      // Label
      foldedPdf.text(label, x, y - cropOff - cropLen - 2);
    }

    // Fold line (center of inside spread)
    foldedPdf.setDrawColor(192, 192, 192);
    foldedPdf.setLineDashPattern([1, 1], 0);
    foldedPdf.line(marginX + halfW, botCardY - cropOff, marginX + halfW, botCardY + spreadH + cropOff);
    foldedPdf.setFontSize(5);
    foldedPdf.setTextColor(192, 192, 192);
    foldedPdf.text("Falz / Fold", marginX + halfW + 1, botCardY + spreadH + cropOff + 4);

    // Dimensions label
    foldedPdf.setFontSize(6);
    foldedPdf.setTextColor(128, 128, 128);
    foldedPdf.text(`Card: ${spreadW}\u00d7${spreadH}mm | Page: A4 (210\u00d7297mm)`, a4W / 2 - 30, a4H - 8);

    return foldedPdf.output("blob");
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
