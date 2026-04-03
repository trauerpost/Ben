import { renderCardHTML } from "./card-to-html";
import { renderSpreadHTML, autoShrinkText } from "./card-to-html-v2";
import { getCardDimensions } from "./wizard-state";
import { getTemplateById } from "./card-templates";
import { getTemplateConfig } from "./template-configs";
import type { WizardState } from "./wizard-state";
import type { Browser } from "puppeteer-core";

/** Launch browser with exponential backoff retry (1s → 2s → 4s) */
async function launchBrowserWithRetry(maxAttempts = 3): Promise<Browser> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[pdf] Browser launch attempt ${attempt}/${maxAttempts}`);
      const puppeteerCore = await import("puppeteer-core");
      const chromium = await import("@sparticuz/chromium");
      return await puppeteerCore.default.launch({
        args: chromium.default.args,
        executablePath: await chromium.default.executablePath(),
        headless: true,
      }) as Browser;
    } catch (coreErr) {
      // First attempt: try puppeteer fallback
      if (attempt === 1) {
        try {
          const puppeteer = await import("puppeteer");
          return await puppeteer.default.launch({ headless: true }) as unknown as Browser;
        } catch {
          // fallback also failed, continue retry loop
        }
      }
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.warn(`[pdf] Browser launch failed (attempt ${attempt}), retrying in ${delay}ms:`, coreErr);
        await new Promise(r => setTimeout(r, delay));
      } else {
        console.error(`[pdf] Browser launch failed after ${maxAttempts} attempts:`, coreErr);
        throw coreErr;
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
  let html: string;
  let pageWidthMm: number;
  let pageHeightMm: number;

  if (isV2) {
    const config = getTemplateConfig(templateId);
    if (!config) throw new Error(`Template config not found: ${templateId}`);
    html = await renderSpreadHTML(state, { baseUrl: options?.baseUrl });
    pageWidthMm = config.spreadWidthMm;
    pageHeightMm = config.spreadHeightMm;
  } else {
    const template = getTemplateById(templateId);
    if (!template) throw new Error("No template selected");
    html = await renderCardHTML(state);
    pageWidthMm = dims.widthMm;
    pageHeightMm = dims.heightMm;
  }

  console.log(`[pdf] Template: ${state.templateId}, Page: ${pageWidthMm}x${pageHeightMm}mm`);

  // Launch browser with retry
  console.log(`[pdf] Step: launch browser`);
  const browser = await launchBrowserWithRetry();

  try {
    console.log(`[pdf] Step: create page + set content`);
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);

    await page.setContent(html, { waitUntil: "networkidle2", timeout: 60000 });

    // v2: auto-shrink text that overflows
    if (isV2) {
      console.log(`[pdf] Step: auto-shrink text`);
      const config = getTemplateConfig(templateId)!;
      await autoShrinkText(page, config);
    }

    // Wait for fonts to finish loading before generating PDF
    console.log(`[pdf] Step: wait for fonts`);
    await page.evaluateHandle(() => document.fonts.ready);

    console.log(`[pdf] Step: generate PDF buffer`);
    const pdfBuffer = await page.pdf({
      width: `${pageWidthMm}mm`,
      height: `${pageHeightMm}mm`,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    console.log(`[pdf] Step: complete (${pdfBuffer.byteLength} bytes)`);
    return Buffer.from(pdfBuffer);
  } catch (err) {
    console.error(`[pdf] PDF generation failed at runtime:`, err);
    throw err;
  } finally {
    await browser.close();
  }
}
