import { renderCardHTML } from "./card-to-html";
import { renderSpreadHTML, autoShrinkText, buildPageState } from "./card-to-html-v2";
import { getCardDimensions } from "./wizard-state";
import { getTemplateById } from "./card-templates";
import { getTemplateConfig } from "./template-configs";
import type { WizardState, ElementOverride } from "./wizard-state";
import type { Browser } from "puppeteer-core";

/**
 * Chromium binary URL for @sparticuz/chromium-min on Vercel.
 * Must match the installed @sparticuz/chromium-min version.
 */
const CHROMIUM_REMOTE_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar";

/** Launch browser with exponential backoff retry (1s → 2s → 4s) */
async function launchBrowserWithRetry(maxAttempts = 3): Promise<Browser> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[pdf] Browser launch attempt ${attempt}/${maxAttempts}`);
      const puppeteerCore = await import("puppeteer-core");

      // Try chromium-min first (Vercel serverless — downloads binary at runtime)
      try {
        const chromiumMin = await import("@sparticuz/chromium-min");
        const execPath = await chromiumMin.default.executablePath(CHROMIUM_REMOTE_URL);
        console.log(`[pdf] Using chromium-min, execPath: ${execPath}`);
        return await puppeteerCore.default.launch({
          args: chromiumMin.default.args,
          executablePath: execPath,
          headless: true,
        }) as Browser;
      } catch (minErr) {
        console.warn(`[pdf] chromium-min failed, trying chromium:`, minErr);
      }

      // Fallback: try regular @sparticuz/chromium (local dev)
      try {
        const chromium = await import("@sparticuz/chromium");
        return await puppeteerCore.default.launch({
          args: chromium.default.args,
          executablePath: await chromium.default.executablePath(),
          headless: true,
        }) as Browser;
      } catch {
        // fall through
      }

      // Last resort: full puppeteer with bundled Chromium (local dev only)
      const puppeteer = await import("puppeteer");
      return await puppeteer.default.launch({ headless: true }) as unknown as Browser;
    } catch (err) {
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.warn(`[pdf] Browser launch failed (attempt ${attempt}), retrying in ${delay}ms:`, err);
        await new Promise(r => setTimeout(r, delay));
      } else {
        console.error(`[pdf] Browser launch failed after ${maxAttempts} attempts:`, err);
        throw err;
      }
    }
  }
  throw new Error("[pdf] Browser launch failed — unreachable");
}

export async function generateCardPDF(state: WizardState, options?: { baseUrl?: string }): Promise<Buffer> {
  console.log(`[pdf] Step: resolve dimensions`);
  const dims = getCardDimensions(state);
  if (!dims) throw new Error("Cannot determine card dimensions");

  const templateId = state.templateId ?? "";
  const isV2 = templateId.startsWith("TI");

  // Generate HTML — v2 (absolute positioning) or v1 (CSS Grid)
  console.log(`[pdf] Step: generate HTML (${isV2 ? "v2" : "v1"})`);
  let htmlPages: string[];
  let pageWidthMm: number;
  let pageHeightMm: number;

  if (isV2) {
    const config = getTemplateConfig(templateId);
    if (!config) throw new Error(`Template config not found: ${templateId}`);
    pageWidthMm = config.spreadWidthMm;
    pageHeightMm = config.spreadHeightMm;

    // Check if template has outside-spread (folded card) or front/back pages
    const hasOuterPages = config.elements.some(el => el.page === "outside-spread");
    const hasBackPage = config.elements.some(el => el.page && el.page !== "front");

    if (hasOuterPages) {
      // Folded card: render sections separately, then combine onto one 140×210mm page via pdf-lib
      // Top half: outside spread (140×105mm), Bottom half: inside spread (front+back side by side)
      pageWidthMm = config.spreadWidthMm;
      pageHeightMm = config.spreadHeightMm;
      const halfWidthMm = config.spreadWidthMm / 2;

      const outsideState = buildPageState(state, config, "outside-spread");
      const outsideHTML = await renderSpreadHTML(outsideState, { baseUrl: options?.baseUrl });

      const frontState = buildPageState(state, config, "front");
      const backState = buildPageState(state, config, "back");
      const frontHTML = await renderSpreadHTML(frontState, { baseUrl: options?.baseUrl, renderWidthMm: halfWidthMm });
      const backHTML = await renderSpreadHTML(backState, { baseUrl: options?.baseUrl, renderWidthMm: halfWidthMm });

      // Render each section as a separate PDF, then merge onto one page
      htmlPages = [outsideHTML, frontHTML, backHTML];
      console.log(`[pdf] Folded card: will compose onto 1 page ${pageWidthMm}x${pageHeightMm * 2}mm`);
    } else if (hasBackPage) {
      // Multi-page: render front and back as separate PDF pages
      const frontState = buildPageState(state, config, "front");
      const backState = buildPageState(state, config, "back");
      htmlPages = [
        await renderSpreadHTML(frontState, { baseUrl: options?.baseUrl }),
        await renderSpreadHTML(backState, { baseUrl: options?.baseUrl }),
      ];
      console.log(`[pdf] Multi-page template: ${htmlPages.length} pages`);
    } else {
      htmlPages = [await renderSpreadHTML(state, { baseUrl: options?.baseUrl })];
    }
  } else {
    const template = getTemplateById(templateId);
    if (!template) throw new Error("No template selected");
    htmlPages = [await renderCardHTML(state)];
    pageWidthMm = dims.widthMm;
    pageHeightMm = dims.heightMm;
  }

  // Detect folded card for compositing
  const isFoldedCard = isV2 && htmlPages.length === 3 && (() => {
    const config = getTemplateConfig(templateId);
    return config?.elements.some(el => el.page === "outside-spread") ?? false;
  })();

  // Build per-page render dimensions
  const pageDims: { widthMm: number; heightMm: number }[] = [];
  if (isFoldedCard) {
    const halfWidthMm = pageWidthMm / 2;
    pageDims.push({ widthMm: pageWidthMm, heightMm: pageHeightMm });  // outside spread
    pageDims.push({ widthMm: halfWidthMm, heightMm: pageHeightMm });  // front inner
    pageDims.push({ widthMm: halfWidthMm, heightMm: pageHeightMm });  // back inner
  } else {
    for (let i = 0; i < htmlPages.length; i++) {
      pageDims.push({ widthMm: pageWidthMm, heightMm: pageHeightMm });
    }
  }

  console.log(`[pdf] Template: ${state.templateId}, Sections: ${htmlPages.length}, Folded: ${isFoldedCard}, Dims: ${pageDims.map(d => `${d.widthMm}x${d.heightMm}mm`).join(", ")}`);

  // Launch browser with retry
  console.log(`[pdf] Step: launch browser`);
  const browser = await launchBrowserWithRetry();

  try {
    const pdfBuffers: Buffer[] = [];

    for (let i = 0; i < htmlPages.length; i++) {
      const d = pageDims[i];
      console.log(`[pdf] Step: render section ${i + 1}/${htmlPages.length} (${d.widthMm}x${d.heightMm}mm)`);
      const page = await browser.newPage();
      page.setDefaultTimeout(15000);

      await page.setContent(htmlPages[i], { waitUntil: "networkidle2", timeout: 60000 });

      // v2: auto-shrink text that overflows
      if (isV2) {
        const config = getTemplateConfig(templateId)!;
        await autoShrinkText(page, config);
      }

      // Wait for fonts to finish loading before generating PDF
      await page.evaluateHandle(() => document.fonts.ready);

      const pdfBuffer = await page.pdf({
        width: `${d.widthMm}mm`,
        height: `${d.heightMm}mm`,
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });

      pdfBuffers.push(Buffer.from(pdfBuffer));
      await page.close();
    }

    let finalPdf: Buffer;

    if (isFoldedCard && pdfBuffers.length === 3) {
      // Compose 3 sections onto ONE page: outside on top, front+back side by side on bottom
      finalPdf = await composeFoldedCardPdf(pdfBuffers[0], pdfBuffers[1], pdfBuffers[2], pageWidthMm, pageHeightMm);
    } else if (pdfBuffers.length === 1) {
      finalPdf = pdfBuffers[0];
    } else {
      finalPdf = await mergePdfBuffers(pdfBuffers);
    }

    console.log(`[pdf] Step: complete (${finalPdf.byteLength} bytes, folded: ${isFoldedCard})`);
    return finalPdf;
  } catch (err) {
    console.error(`[pdf] PDF generation failed at runtime:`, err);
    throw err;
  } finally {
    await browser.close();
  }
}


/**
 * Compose a folded card onto A4 (210×297mm):
 *   Cards centered with crop marks and ruler.
 *   Top card: outside spread (140×105mm)
 *   Bottom card: inside spread — front (left 70mm) + back (right 70mm)
 *   Gap between cards: 10mm
 *
 * pdf-lib uses bottom-left origin, so y=0 is bottom of page.
 */
async function composeFoldedCardPdf(
  outsideBuf: Buffer,
  frontBuf: Buffer,
  backBuf: Buffer,
  spreadWidthMm: number,
  cardHeightMm: number
): Promise<Buffer> {
  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

  const mmToPt = (mm: number): number => mm * 2.83465;

  // A4 dimensions
  const a4W = mmToPt(210);
  const a4H = mmToPt(297);
  const cardW = mmToPt(spreadWidthMm);   // 140mm
  const cardH = mmToPt(cardHeightMm);     // 105mm
  const halfCardW = cardW / 2;            // 70mm
  const gap = mmToPt(10);                 // 10mm gap between cards
  const cropLen = mmToPt(5);              // 5mm crop mark length
  const cropOffset = mmToPt(3);           // 3mm offset from card edge

  // Center horizontally
  const marginX = (a4W - cardW) / 2;     // (210-140)/2 = 35mm
  // Center vertically: 2 cards + gap
  const totalContentH = cardH * 2 + gap;  // 105+105+10 = 220mm
  const marginY = (a4H - totalContentH) / 2; // (297-220)/2 = 38.5mm

  // Card positions (bottom-left origin)
  const topCardX = marginX;
  const topCardY = marginY + cardH + gap;  // bottom card first, then gap, then top card
  const botCardX = marginX;
  const botCardY = marginY;

  const final = await PDFDocument.create();
  const page = final.addPage([a4W, a4H]);
  const font = await final.embedFont(StandardFonts.Helvetica);

  // Load and embed each section
  const outsideDoc = await PDFDocument.load(outsideBuf);
  const frontDoc = await PDFDocument.load(frontBuf);
  const backDoc = await PDFDocument.load(backBuf);

  const [outsidePage] = await final.embedPdf(outsideDoc, [0]);
  const [frontPage] = await final.embedPdf(frontDoc, [0]);
  const [backPage] = await final.embedPdf(backDoc, [0]);

  // Draw outside spread (top)
  page.drawPage(outsidePage, { x: topCardX, y: topCardY, width: cardW, height: cardH });

  // Draw inside spread (bottom) — front left + back right
  page.drawPage(frontPage, { x: botCardX, y: botCardY, width: halfCardW, height: cardH });
  page.drawPage(backPage, { x: botCardX + halfCardW, y: botCardY, width: halfCardW, height: cardH });

  const gray = rgb(0.5, 0.5, 0.5);
  const lightGray = rgb(0.75, 0.75, 0.75);
  const lineW = 0.5;

  // ── Crop marks for both cards ──
  const cards = [
    { x: topCardX, y: topCardY, label: "Außenseite (Outside)" },
    { x: botCardX, y: botCardY, label: "Innenseite (Inside)" },
  ];

  for (const card of cards) {
    const cx = card.x;
    const cy = card.y;
    // Top-left corner
    page.drawLine({ start: { x: cx - cropOffset - cropLen, y: cy + cardH }, end: { x: cx - cropOffset, y: cy + cardH }, thickness: lineW, color: gray });
    page.drawLine({ start: { x: cx, y: cy + cardH + cropOffset }, end: { x: cx, y: cy + cardH + cropOffset + cropLen }, thickness: lineW, color: gray });
    // Top-right corner
    page.drawLine({ start: { x: cx + cardW + cropOffset, y: cy + cardH }, end: { x: cx + cardW + cropOffset + cropLen, y: cy + cardH }, thickness: lineW, color: gray });
    page.drawLine({ start: { x: cx + cardW, y: cy + cardH + cropOffset }, end: { x: cx + cardW, y: cy + cardH + cropOffset + cropLen }, thickness: lineW, color: gray });
    // Bottom-left corner
    page.drawLine({ start: { x: cx - cropOffset - cropLen, y: cy }, end: { x: cx - cropOffset, y: cy }, thickness: lineW, color: gray });
    page.drawLine({ start: { x: cx, y: cy - cropOffset - cropLen }, end: { x: cx, y: cy - cropOffset }, thickness: lineW, color: gray });
    // Bottom-right corner
    page.drawLine({ start: { x: cx + cardW + cropOffset, y: cy }, end: { x: cx + cardW + cropOffset + cropLen, y: cy }, thickness: lineW, color: gray });
    page.drawLine({ start: { x: cx + cardW, y: cy - cropOffset - cropLen }, end: { x: cx + cardW, y: cy - cropOffset }, thickness: lineW, color: gray });

    // Label above card
    page.drawText(card.label, {
      x: cx, y: cy + cardH + cropOffset + cropLen + mmToPt(2),
      size: 7, font, color: gray,
    });
  }

  // ── Fold line indicator (center of inside spread) ──
  const foldX = botCardX + halfCardW;
  page.drawLine({
    start: { x: foldX, y: botCardY - cropOffset },
    end: { x: foldX, y: botCardY + cardH + cropOffset },
    thickness: 0.3, color: lightGray, dashArray: [3, 3],
  });
  page.drawText("Falz / Fold", {
    x: foldX + mmToPt(1), y: botCardY - cropOffset - mmToPt(4),
    size: 5, font, color: lightGray,
  });

  // ── Ruler (left side, vertical, in mm) ──
  const rulerX = marginX - mmToPt(15);
  const rulerStartY = botCardY;
  const rulerEndY = topCardY + cardH;
  const rulerTotalMm = Math.round((rulerEndY - rulerStartY) / mmToPt(1));

  // Ruler line
  page.drawLine({ start: { x: rulerX, y: rulerStartY }, end: { x: rulerX, y: rulerEndY }, thickness: 0.3, color: gray });

  // Tick marks every 10mm, labels every 20mm
  for (let mm = 0; mm <= rulerTotalMm; mm += 10) {
    const y = rulerStartY + mmToPt(mm);
    const tickLen = mm % 20 === 0 ? mmToPt(3) : mmToPt(1.5);
    page.drawLine({ start: { x: rulerX - tickLen, y }, end: { x: rulerX, y }, thickness: 0.3, color: gray });
    if (mm % 20 === 0) {
      page.drawText(`${mm}`, { x: rulerX - tickLen - mmToPt(4), y: y - 2, size: 5, font, color: gray });
    }
  }

  // ── Dimensions label (bottom center) ──
  page.drawText(`Card: ${spreadWidthMm}×${cardHeightMm}mm | Page: A4 (210×297mm)`, {
    x: a4W / 2 - mmToPt(30), y: mmToPt(8),
    size: 6, font, color: gray,
  });

  const bytes = await final.save();
  return Buffer.from(bytes);
}

/**
 * Merge multiple single-page PDF buffers into one multi-page PDF.
 * Uses pdf-lib for proper PDF merging.
 */
async function mergePdfBuffers(buffers: Buffer[]): Promise<Buffer> {
  const { PDFDocument } = await import("pdf-lib");
  const merged = await PDFDocument.create();
  for (const buf of buffers) {
    const doc = await PDFDocument.load(buf);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    for (const page of pages) {
      merged.addPage(page);
    }
  }
  const bytes = await merged.save();
  return Buffer.from(bytes);
}
