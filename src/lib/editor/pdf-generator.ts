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
      // Folded card: outside spread (full width) + inside spread (two half-width pages side by side)
      pageWidthMm = config.spreadWidthMm;
      pageHeightMm = config.spreadHeightMm;
      const halfWidthMm = config.spreadWidthMm / 2;

      // Page 1: Outside spread at full width (only outside-spread elements visible)
      const outsideState = buildPageState(state, config, "outside-spread");
      const outsideHTML = await renderSpreadHTML(outsideState, { baseUrl: options?.baseUrl });

      // Pages 2-3: Inside pages rendered at half width (70mm) with renderWidthMm override
      const frontState = buildPageState(state, config, "front");
      const backState = buildPageState(state, config, "back");
      const frontHTML = await renderSpreadHTML(frontState, { baseUrl: options?.baseUrl, renderWidthMm: halfWidthMm });
      const backHTML = await renderSpreadHTML(backState, { baseUrl: options?.baseUrl, renderWidthMm: halfWidthMm });

      htmlPages = [outsideHTML, frontHTML, backHTML];
      console.log(`[pdf] Folded card: 3 pages (outside spread + front + back @ ${halfWidthMm}mm)`);
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

  // Build per-page dimensions (may vary for folded cards)
  const pageDims: { widthMm: number; heightMm: number }[] = htmlPages.map(() => ({
    widthMm: pageWidthMm,
    heightMm: pageHeightMm,
  }));

  // For folded cards with outside spread: pages 2+ are inner pages at half width
  if (isV2) {
    const config = getTemplateConfig(templateId);
    const hasOuterPages = config?.elements.some(el => el.page === "outside-spread") ?? false;
    if (hasOuterPages && htmlPages.length >= 3) {
      const halfWidthMm = pageWidthMm / 2;
      pageDims[1] = { widthMm: halfWidthMm, heightMm: pageHeightMm };
      pageDims[2] = { widthMm: halfWidthMm, heightMm: pageHeightMm };
    }
  }

  console.log(`[pdf] Template: ${state.templateId}, Pages: ${htmlPages.length}, Dims: ${pageDims.map(d => `${d.widthMm}x${d.heightMm}mm`).join(", ")}`);

  // Launch browser with retry
  console.log(`[pdf] Step: launch browser`);
  const browser = await launchBrowserWithRetry();

  try {
    const pdfBuffers: Buffer[] = [];

    for (let i = 0; i < htmlPages.length; i++) {
      const dims = pageDims[i];
      console.log(`[pdf] Step: render page ${i + 1}/${htmlPages.length} (${dims.widthMm}x${dims.heightMm}mm)`);
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
        width: `${dims.widthMm}mm`,
        height: `${dims.heightMm}mm`,
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });

      pdfBuffers.push(Buffer.from(pdfBuffer));
      await page.close();
    }

    // Merge PDF pages if multiple
    let finalPdf: Buffer;
    if (pdfBuffers.length === 1) {
      finalPdf = pdfBuffers[0];
    } else {
      finalPdf = await mergePdfBuffers(pdfBuffers);
    }

    console.log(`[pdf] Step: complete (${finalPdf.byteLength} bytes, ${pdfBuffers.length} pages)`);
    return finalPdf;
  } catch (err) {
    console.error(`[pdf] PDF generation failed at runtime:`, err);
    throw err;
  } finally {
    await browser.close();
  }
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
