import { renderCardHTML } from "./card-to-html";
import { renderSpreadHTML, autoShrinkText } from "./card-to-html-v2";
import { getCardDimensions } from "./wizard-state";
import { getTemplateById } from "./card-templates";
import { getTemplateConfig } from "./template-configs";
import type { WizardState } from "./wizard-state";
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

    // Check if template has multiple pages (front/back)
    const hasBackPage = config.elements.some(el => el.page && el.page !== "front");

    if (hasBackPage) {
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

  console.log(`[pdf] Template: ${state.templateId}, Page: ${pageWidthMm}x${pageHeightMm}mm, Pages: ${htmlPages.length}`);

  // Launch browser with retry
  console.log(`[pdf] Step: launch browser`);
  const browser = await launchBrowserWithRetry();

  try {
    const pdfBuffers: Buffer[] = [];

    for (let i = 0; i < htmlPages.length; i++) {
      console.log(`[pdf] Step: render page ${i + 1}/${htmlPages.length}`);
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
        width: `${pageWidthMm}mm`,
        height: `${pageHeightMm}mm`,
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
 * Build a WizardState that hides all elements NOT on the given page.
 * Same logic as preview route's buildPageState.
 */
function buildPageState(
  state: WizardState,
  config: NonNullable<ReturnType<typeof getTemplateConfig>>,
  pageId: string
): WizardState {
  const overrides = { ...(state.elementOverrides ?? {}) };
  for (const el of config.elements) {
    const elPage = el.page ?? "front";
    if (elPage !== pageId) {
      overrides[el.id] = { ...overrides[el.id], hidden: true };
    }
  }
  return { ...state, elementOverrides: overrides };
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
