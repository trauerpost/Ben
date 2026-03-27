import { getCardDimensions } from "./wizard-state";
import { getTemplateById } from "./card-templates";
import type { WizardState, TextContent } from "./wizard-state";
import type { PanelTemplate, TemplateSlot } from "./card-templates";

/**
 * Fetches an image URL and converts it to a base64 data URI.
 * Falls back to empty string if the fetch fails.
 */
async function imageToBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${buf.toString("base64")}`;
  } catch (err) {
    console.warn(`[card-to-html] Failed to fetch image: ${url}`, err);
    return "";
  }
}

function renderFontLinks(fontFamily: string): string {
  const encoded = encodeURIComponent(fontFamily);
  return `<link href="https://fonts.googleapis.com/css2?family=${encoded}:wght@400;700&display=swap" rel="stylesheet">`;
}

// ── Per-field typography styles ──

const FIELD_STYLES: Record<string, { weight: string; style: string; transform: string }> = {
  heading:             { weight: "normal", style: "normal",  transform: "none" },
  relationshipLabels:  { weight: "normal", style: "normal",  transform: "none" },
  name:                { weight: "bold",   style: "normal",  transform: "none" },
  dates:               { weight: "normal", style: "normal",  transform: "none" },
  birthDate:           { weight: "normal", style: "normal",  transform: "none" },
  deathDate:           { weight: "normal", style: "normal",  transform: "none" },
  locationBirth:       { weight: "normal", style: "italic",  transform: "none" },
  locationDeath:       { weight: "normal", style: "italic",  transform: "none" },
  quote:               { weight: "normal", style: "italic",  transform: "none" },
  quoteAuthor:         { weight: "normal", style: "normal",  transform: "none" },
  closingVerse:        { weight: "normal", style: "italic",  transform: "none" },
  dividerSymbol:       { weight: "normal", style: "normal",  transform: "none" },
};

// ── Font size map for each TextContent field ──

const FIELD_FONT_SIZE_MAP: Record<string, keyof TextContent> = {
  heading: "headingFontSize",
  name: "nameFontSize",
  dates: "datesFontSize",
  quote: "quoteFontSize",
  dividerSymbol: "datesFontSize",
  birthDate: "datesFontSize",
  deathDate: "datesFontSize",
  locationBirth: "locationFontSize",
  locationDeath: "locationFontSize",
  quoteAuthor: "quoteAuthorFontSize",
  closingVerse: "closingVerseFontSize",
  relationshipLabels: "headingFontSize",
};

function getFieldFontSize(textContent: TextContent, field: string): number {
  const sizeKey = FIELD_FONT_SIZE_MAP[field];
  if (sizeKey) {
    const val = textContent[sizeKey];
    if (typeof val === "number") return val;
  }
  return 14;
}

function getFieldValue(textContent: TextContent, field: string): string {
  const val = textContent[field as keyof TextContent];
  return typeof val === "string" ? val : "";
}

function getFieldStyle(field: string, overrides?: Record<string, { weight?: string; style?: string; transform?: string }>): { weight: string; style: string; transform: string } {
  const base = FIELD_STYLES[field] ?? { weight: "normal", style: "normal", transform: "none" };
  const override = overrides?.[field];
  if (!override) return base;
  return {
    weight: override.weight ?? base.weight,
    style: override.style ?? base.style,
    transform: override.transform ?? base.transform,
  };
}

// ── Slot renderers ──

function renderPhotoSlot(base64: string, gridArea: string, padding = "0"): string {
  if (!base64) {
    return `<div style="grid-area:${gridArea};display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px;background:#f5f5f5;">Photo</div>`;
  }
  return `<div style="grid-area:${gridArea};padding:${padding};box-sizing:border-box;">
    <div style="width:100%;height:100%;background-image:url('${base64}');background-size:cover;background-position:center top;border-radius:2px;"></div>
  </div>`;
}

function renderTextSlot(
  textContent: TextContent,
  slot: TemplateSlot,
  photoBase64?: string,
): string {
  const fields = slot.textFields ?? [];
  const { fontFamily, fontColor } = textContent;
  const align = slot.textAlign ?? textContent.textAlign;

  const fieldDivs = fields
    .map((field) => {
      const value = getFieldValue(textContent, field);
      if (!value) return "";
      const fontSize = getFieldFontSize(textContent, field);
      const fStyle = getFieldStyle(field, slot.styleOverrides);
      const escaped = value.replace(/\n/g, "<br>");
      const isName = field === "name";
      const lineHeight = isName ? "1.3" : "1.5";
      const mb = isName ? "3mm" : "1.5mm";
      return `<div style="font-size:${fontSize}px;font-weight:${fStyle.weight};font-style:${fStyle.style};text-transform:${fStyle.transform};line-height:${lineHeight};white-space:pre-wrap;word-wrap:break-word;margin-bottom:${mb};">${escaped}</div>`;
    })
    .filter(Boolean)
    .join("\n        ");

  // T6 compound slot: text + small photo at bottom
  let photoHtml = "";
  if (slot.includePhoto && photoBase64) {
    photoHtml = `<div style="margin-top:auto;max-height:30%;"><img src="${photoBase64}" style="object-fit:cover;width:100%;max-height:100%;" /></div>`;
  }

  return `<div style="grid-area:${slot.gridArea};padding:4mm;display:flex;flex-direction:column;align-items:${align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center"};justify-content:center;font-family:'${fontFamily}',serif;color:${fontColor};text-align:${align};box-sizing:border-box;overflow:hidden;gap:0.5mm;">
        ${fieldDivs}
        ${photoHtml}
      </div>`;
}

function renderDecorationSlot(base64: string, gridArea: string): string {
  if (!base64) {
    return `<div style="grid-area:${gridArea};"></div>`;
  }
  return `<div style="grid-area:${gridArea};display:flex;align-items:center;justify-content:center;padding:4mm;box-sizing:border-box;">
        <img src="${base64}" style="max-width:100%;max-height:100%;object-fit:contain;" />
      </div>`;
}

// ── Panel renderer ──

async function renderPanel(
  panel: PanelTemplate,
  state: WizardState,
  photoBase64: string,
  decoBase64: string,
  bgBase64: string,
  widthMm: number,
  heightMm: number,
): Promise<string> {
  // Panel background
  let bgStyle = "";
  if (panel.defaultBackground === "image") {
    if (state.background.type === "image" && bgBase64) {
      bgStyle = `background-image:url('${bgBase64}');background-size:cover;background-position:center;`;
    } else {
      bgStyle = `background-color:${state.background.color};`;
    }
  } else {
    bgStyle = `background-color:${state.background.color};`;
  }

  // Render slots
  const slotHtmlParts: string[] = [];
  for (const slot of panel.slots) {
    switch (slot.type) {
      case "photo":
        slotHtmlParts.push(renderPhotoSlot(photoBase64, slot.gridArea, slot.photoPadding ?? "0"));
        break;
      case "text":
        slotHtmlParts.push(renderTextSlot(state.textContent, slot, photoBase64));
        break;
      case "decoration":
        slotHtmlParts.push(renderDecorationSlot(decoBase64, slot.gridArea));
        break;
    }
  }

  return `<div style="width:${widthMm}mm;height:${heightMm}mm;display:grid;grid-template-rows:${panel.gridTemplateRows};grid-template-columns:${panel.gridTemplateColumns};${bgStyle}box-sizing:border-box;overflow:hidden;">
      ${slotHtmlParts.join("\n      ")}
    </div>`;
}

const PAGE_BREAK = `<div style="page-break-after:always;"></div>`;

/**
 * Renders the card as a self-contained HTML document for Puppeteer PDF generation.
 */
export async function renderCardHTML(state: WizardState): Promise<string> {
  const dims = getCardDimensions(state);
  if (!dims) throw new Error("Cannot determine card dimensions");

  const templateId = state.templateId;
  if (!templateId) throw new Error("No template selected");

  const template = getTemplateById(templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);

  const isFolded = template.cardFormat === "folded";

  // Pre-fetch all images to base64
  const photoBase64 = state.photo.url ? await imageToBase64(state.photo.url) : "";
  const decoBase64 = state.decoration.assetUrl ? await imageToBase64(state.decoration.assetUrl) : "";
  const bgBase64 = state.background.type === "image" && state.background.imageUrl
    ? await imageToBase64(state.background.imageUrl)
    : "";

  // Panel dimensions
  const panelW = isFolded ? dims.widthMm / 2 : dims.widthMm;
  const panelH = dims.heightMm;

  // Page dimensions for @page rule
  const pageW = isFolded ? dims.widthMm : panelW;
  const pageH = panelH;

  let pages = "";

  if (isFolded) {
    // Folded card: 2 spread pages
    // Page 1: Outside spread — back (left) + front (right)
    const backPanel = template.panels.find((p) => p.panelId === "back");
    const frontPanel = template.panels.find((p) => p.panelId === "front");

    pages += `<div style="width:${dims.widthMm}mm;height:${panelH}mm;display:flex;">`;
    if (backPanel) {
      pages += await renderPanel(backPanel, state, photoBase64, decoBase64, bgBase64, panelW, panelH);
    } else {
      pages += `<div style="width:${panelW}mm;height:${panelH}mm;background:white;"></div>`;
    }
    if (frontPanel) {
      pages += await renderPanel(frontPanel, state, photoBase64, decoBase64, bgBase64, panelW, panelH);
    } else {
      pages += `<div style="width:${panelW}mm;height:${panelH}mm;background:white;"></div>`;
    }
    pages += `</div>`;

    pages += PAGE_BREAK;

    // Page 2: Inside spread — inside-left + inside-right
    const insideLeft = template.panels.find((p) => p.panelId === "inside-left");
    const insideRight = template.panels.find((p) => p.panelId === "inside-right");

    pages += `<div style="width:${dims.widthMm}mm;height:${panelH}mm;display:flex;">`;
    if (insideLeft) {
      pages += await renderPanel(insideLeft, state, photoBase64, decoBase64, bgBase64, panelW, panelH);
    } else {
      pages += `<div style="width:${panelW}mm;height:${panelH}mm;background:white;"></div>`;
    }
    if (insideRight) {
      pages += await renderPanel(insideRight, state, photoBase64, decoBase64, bgBase64, panelW, panelH);
    } else {
      pages += `<div style="width:${panelW}mm;height:${panelH}mm;background:white;"></div>`;
    }
    pages += `</div>`;
  } else if (template.renderMode === "spread") {
    // Spread: ONE page — the single panel IS the full spread
    const spreadPanel = template.panels[0];
    if (spreadPanel) {
      pages += await renderPanel(spreadPanel, state, photoBase64, decoBase64, bgBase64, dims.widthMm, panelH);
    }
  } else {
    // Single card (pages mode): each panel = its own page
    for (let i = 0; i < template.panels.length; i++) {
      const panel = template.panels[i];
      pages += await renderPanel(panel, state, photoBase64, decoBase64, bgBase64, panelW, panelH);
      if (i < template.panels.length - 1) {
        pages += PAGE_BREAK;
      }
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${renderFontLinks(state.textContent.fontFamily)}
  <style>
    @page { size: ${pageW}mm ${pageH}mm; margin: 0; }
    * { margin: 0; padding: 0; }
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>${pages}</body>
</html>`;
}
