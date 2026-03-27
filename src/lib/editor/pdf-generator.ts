import { renderCardHTML } from "./card-to-html";
import { renderSpreadHTML, autoShrinkText } from "./card-to-html-v2";
import { getCardDimensions } from "./wizard-state";
import { getTemplateById } from "./card-templates";
import { getTemplateConfig } from "./template-configs";
import type { WizardState } from "./wizard-state";

export async function generateCardPDF(state: WizardState): Promise<Buffer> {
  const dims = getCardDimensions(state);
  if (!dims) throw new Error("Cannot determine card dimensions");

  const templateId = state.templateId ?? "";
  const isV2 = templateId.startsWith("TI");

  // Generate HTML — v2 (absolute positioning) or v1 (CSS Grid)
  let html: string;
  let pageWidthMm: number;
  let pageHeightMm: number;

  if (isV2) {
    const config = getTemplateConfig(templateId);
    if (!config) throw new Error(`Template config not found: ${templateId}`);
    html = await renderSpreadHTML(state);
    pageWidthMm = config.spreadWidthMm;
    pageHeightMm = config.spreadHeightMm;
  } else {
    const template = getTemplateById(templateId);
    if (!template) throw new Error("No template selected");
    html = await renderCardHTML(state);
    const isFolded = template.cardFormat === "folded";
    pageWidthMm = isFolded ? dims.widthMm : dims.widthMm;
    pageHeightMm = dims.heightMm;
  }

  // Launch Puppeteer
  let browser;
  try {
    const puppeteerCore = await import("puppeteer-core");
    const chromium = await import("@sparticuz/chromium");
    browser = await puppeteerCore.default.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });
  } catch {
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.default.launch({ headless: true });
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle2", timeout: 60000 });

    // v2: auto-shrink text that overflows
    if (isV2) {
      const config = getTemplateConfig(templateId)!;
      await autoShrinkText(page, config);
    }

    const pdfBuffer = await page.pdf({
      width: `${pageWidthMm}mm`,
      height: `${pageHeightMm}mm`,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
