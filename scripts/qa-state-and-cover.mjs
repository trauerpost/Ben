/**
 * QA Tests USER-103 to USER-116:
 *   Part 1 (USER-103..110): State preservation after page switch
 *   Part 2 (USER-111..116): Cover photo in preview/PDF
 *
 * Uses Gemini 3.1 Pro for visual scoring (median of 3 runs).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { callGeminiWithRetry } from './lib/gemini-keys.mjs';

const BASE = "http://localhost:3002/de/builder-v2";

const MODEL = "gemini-3.1-pro-preview";
const OUT = path.join(process.cwd(), "test-results", "qa-state-cover");
fs.mkdirSync(OUT, { recursive: true });

const THRESHOLD = 80;
const WOMAN_PHOTO = path.resolve("Woman.jpg");

// ── Grid axes helper ──

async function addGridAxes(imagePath, outputPath) {
  const img = await loadImage(imagePath);
  const srcW = img.width, srcH = img.height;
  const margin = 40;
  const canvas = createCanvas(srcW + margin, srcH + margin);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, srcW, srcH, margin, margin, srcW, srcH);

  ctx.strokeStyle = "#ff0000";
  ctx.fillStyle = "#ff0000";
  ctx.lineWidth = 1;
  ctx.font = "11px sans-serif";

  for (let pct = 0; pct <= 100; pct += 10) {
    const x = margin + Math.round((pct / 100) * srcW);
    ctx.beginPath(); ctx.moveTo(x, margin); ctx.lineTo(x, margin - 8); ctx.stroke();
    ctx.fillText(`${pct}%`, x - 10, margin - 12);
  }
  for (let pct = 0; pct <= 100; pct += 10) {
    const y = margin + Math.round((pct / 100) * srcH);
    ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(margin - 8, y); ctx.stroke();
    ctx.fillText(`${pct}%`, 2, y + 4);
  }

  ctx.strokeStyle = "rgba(255, 0, 0, 0.15)";
  ctx.lineWidth = 0.5;
  for (let pct = 10; pct <= 90; pct += 10) {
    const x = margin + Math.round((pct / 100) * srcW);
    const y = margin + Math.round((pct / 100) * srcH);
    ctx.beginPath(); ctx.moveTo(x, margin); ctx.lineTo(x, margin + srcH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(margin + srcW, y); ctx.stroke();
  }

  const buf = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buf);
  return buf;
}

// ── Gemini API call ──

async function callGemini(imageBufs, prompt) {
  const parts = [{ text: prompt }];
  for (const buf of imageBufs) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: (Buffer.isBuffer(buf) ? buf : fs.readFileSync(buf)).toString("base64"),
      },
    });
  }

  const data = await callGeminiWithRetry(MODEL, {
    contents: [{ parts }],
    generationConfig: { temperature: 0, maxOutputTokens: 4096 },
  });

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { score: 0, summary: "Failed to parse Gemini response", raw: text };
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { score: 0, summary: "JSON parse error", raw: text };
  }
}

// ── Median of 3 runs ──

async function scoreWithMedian(imageBufs, prompt, label) {
  const scores = [];
  for (let i = 0; i < 3; i++) {
    try {
      const result = await callGemini(imageBufs, prompt);
      scores.push(result);
      process.stdout.write(`    Run ${i + 1}: ${result.score}/100  `);
    } catch (err) {
      console.error(`    Run ${i + 1}: ERROR - ${err.message}`);
      scores.push({ score: 0, summary: `Error: ${err.message}` });
    }
  }
  console.log();
  scores.sort((a, b) => a.score - b.score);
  const median = scores[1];
  fs.writeFileSync(
    path.join(OUT, `${label}-result.json`),
    JSON.stringify({ label, runs: scores, median }, null, 2)
  );
  return median;
}

// ── Screenshot helpers ──

async function screenshotCanvas(page, filename) {
  const p = path.join(OUT, filename);
  const canvasEl = page.locator("canvas").first();
  if (await canvasEl.isVisible({ timeout: 3000 }).catch(() => false)) {
    await canvasEl.screenshot({ path: p });
  } else {
    await page.screenshot({ path: p });
  }
  return p;
}

async function screenshotPreviewIframe(page, filename) {
  const p = path.join(OUT, filename);

  const iframe = page.locator('iframe[title="Kartenvorschau"]').first();
  if (await iframe.isVisible({ timeout: 5000 }).catch(() => false)) {
    try {
      const iframeContent = iframe.contentFrame();
      await iframeContent.waitForLoadState("load");
      await page.waitForTimeout(2000);
      await iframeContent.locator("body").screenshot({ path: p });
      return p;
    } catch {
      try {
        await iframe.screenshot({ path: p });
        return p;
      } catch { /* fall through */ }
    }
  }

  // Try modal overlay
  const modal = page.locator(".fixed.inset-0.z-50").first();
  if (await modal.isVisible().catch(() => false)) {
    await modal.screenshot({ path: p });
    return p;
  }

  await page.screenshot({ path: p, fullPage: true });
  return p;
}

// ── Template loading helper ──

async function loadTemplate(page, templateId) {
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1000);

  await page.locator('[data-testid="card-type-sterbebild"]').click({ timeout: 5000 });
  await page.waitForTimeout(500);

  const tpl = page.locator(`[data-testid="template-${templateId}"]`);
  if (!(await tpl.isVisible({ timeout: 5000 }).catch(() => false))) {
    throw new Error(`Template ${templateId} not found`);
  }
  await tpl.click();
  await page.waitForTimeout(4000);
  console.log(`  ${templateId} loaded.`);
}

// ── Nav button helpers ──

function navBtn(page, label) {
  return page.locator("button").filter({ hasText: label }).first();
}

// ── Upload cover photo helper ──

async function uploadCoverPhoto(page) {
  // Try the "Foto hinzufuegen" button with file chooser
  const fotoBtn = page.locator("button").filter({ hasText: "Foto hinzuf" }).first();
  const fotoBtnVisible = await fotoBtn.isVisible({ timeout: 3000 }).catch(() => false);

  if (fotoBtnVisible) {
    const fcPromise = page.waitForEvent("filechooser", { timeout: 5000 }).catch(() => null);
    await fotoBtn.click();
    const fc = await fcPromise;
    if (fc) {
      await fc.setFiles(WOMAN_PHOTO);
      await page.waitForTimeout(3000);
      console.log("    Uploaded via file chooser.");
      return true;
    }
  }

  // Fallback: set files on hidden input
  const inputCount = await page.locator("input[type='file']").count();
  if (inputCount > 0) {
    await page.locator("input[type='file']").first().setInputFiles(WOMAN_PHOTO);
    await page.waitForTimeout(3000);
    console.log("    Uploaded via file input.");
    return true;
  }

  console.log("    WARNING: Could not find upload mechanism.");
  return false;
}

// ── Preview open/close helpers ──

async function openPreview(page) {
  const previewBtn = navBtn(page, /Vorschau/);
  await previewBtn.click();
  await page.waitForTimeout(5000);
}

async function closePreview(page) {
  const closeBtn = page.locator("button").filter({ hasText: /Zur.ck zur Gestaltung/ }).first();
  if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await closeBtn.click();
  } else {
    await page.keyboard.press("Escape");
  }
  await page.waitForTimeout(1000);
}

// ── PDF download + render helpers ──

async function downloadPdf(page, filename) {
  const pdfBtn = page.locator("button").filter({ hasText: /^PDF$/ }).first();
  const downloadPromise = page.waitForEvent("download", { timeout: 60000 });
  await pdfBtn.click();
  const download = await downloadPromise;
  const pdfPath = path.join(OUT, filename);
  await download.saveAs(pdfPath);
  console.log(`    PDF saved: ${filename} (${(fs.statSync(pdfPath).size / 1024).toFixed(0)} KB)`);
  return pdfPath;
}

async function renderPdfPagesToPng(browser, pdfPath) {
  const pdfBuf = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBuf.toString("base64");

  const { PDFDocument } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.load(pdfBuf);
  const pageCount = pdfDoc.getPageCount();
  console.log(`    PDF has ${pageCount} pages`);

  const renderHtml = `<!DOCTYPE html>
<html><head>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs" type="module"></script>
<style>body{margin:0;background:white}canvas{display:block;margin:0}</style>
</head><body><canvas id="pdfCanvas"></canvas>
<script type="module">
import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';
window.renderPdfPage=async function(base64Data,pageNum){
  const raw=atob(base64Data);const uint8=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)uint8[i]=raw.charCodeAt(i);
  const pdf=await pdfjsLib.getDocument({data:uint8}).promise;
  const page=await pdf.getPage(pageNum);
  const scale=2.0;const viewport=page.getViewport({scale});
  const canvas=document.getElementById('pdfCanvas');
  canvas.width=viewport.width;canvas.height=viewport.height;
  canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);
  await page.render({canvasContext:ctx,viewport}).promise;
  return{width:canvas.width,height:canvas.height,pages:pdf.numPages};
};
</script></body></html>`;

  const htmlPath = path.join(OUT, "render.html");
  fs.writeFileSync(htmlPath, renderHtml);

  const renderPage = await browser.newPage();
  await renderPage.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle", timeout: 15000 });
  await renderPage.waitForTimeout(2000);

  const pngPaths = [];
  for (let i = 1; i <= pageCount; i++) {
    try {
      const result = await renderPage.evaluate(
        async ({ b64, pg }) => await window.renderPdfPage(b64, pg),
        { b64: pdfBase64, pg: i }
      );
      await renderPage.setViewportSize({ width: result.width, height: result.height });
      await renderPage.waitForTimeout(500);

      const pngPath = path.join(OUT, `${path.basename(pdfPath, ".pdf")}-page-${i}.png`);
      await renderPage.locator("#pdfCanvas").screenshot({ path: pngPath });
      pngPaths.push(pngPath);
      console.log(`    Page ${i} rendered (${result.width}x${result.height})`);
    } catch (err) {
      console.log(`    Page ${i} render FAILED: ${err.message}`);
    }
  }

  await renderPage.close();
  return pngPaths;
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════

async function main() {
  console.log("=== QA STATE & COVER TESTS (USER-103 to USER-116) ===\n");
  console.log(`Output: ${OUT}`);
  console.log(`Threshold: ${THRESHOLD}/100\n`);

  if (!fs.existsSync(WOMAN_PHOTO)) {
    console.error(`FATAL: Woman.jpg not found at ${WOMAN_PHOTO}`);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const results = [];

  function record(id, name, score, detail) {
    const pass = score >= THRESHOLD;
    results.push({ id, name, score, pass, detail });
    console.log(`  ${pass ? "PASS" : "FAIL"}  ${id}: ${name} = ${score}/100`);
    if (detail?.summary) console.log(`         ${detail.summary}`);
    if (detail?.issues?.length) detail.issues.forEach(i => console.log(`         - ${i}`));
    console.log();
  }

  // ═══════════════════════════════════════════════════════════
  // PART 1: STATE LOSS TESTS (USER-103 to USER-110)
  // ═══════════════════════════════════════════════════════════

  console.log("=" .repeat(60));
  console.log("PART 1: STATE PRESERVATION TESTS");
  console.log("=".repeat(60) + "\n");

  // ---------- USER-103: Edit name on back, switch to front, switch back ----------
  {
    console.log("--- USER-103: Edit name, switch front, switch back ---");
    const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
    await loadTemplate(page, "TI05");

    // Navigate to Innen rechts (back page)
    await navBtn(page, "Innen rechts").click();
    await page.waitForTimeout(1500);

    // Change name text to "Maria Schmidt" via Fabric.js
    await page.evaluate(() => {
      const canvases = document.querySelectorAll("canvas.lower-canvas");
      for (const c of canvases) {
        const fc = c.__fabricCanvas;
        if (!fc) continue;
        const objs = fc.getObjects();
        for (const obj of objs) {
          if (obj.type === "textbox" && obj.text && /Muster/i.test(obj.text)) {
            obj.set("text", obj.text.replace(/\w+\s+Muster\w*/i, "Maria Schmidt"));
            fc.renderAll();
            fc.fire("object:modified", { target: obj });
            return true;
          }
        }
      }
      return false;
    });
    await page.waitForTimeout(1000);

    // Screenshot back page BEFORE switch
    const before = await screenshotCanvas(page, "user103-before.png");

    // Switch to front page (Innen links)
    await navBtn(page, "Innen links").click();
    await page.waitForTimeout(2000);

    // Switch back to Innen rechts
    await navBtn(page, "Innen rechts").click();
    await page.waitForTimeout(1500);

    // Screenshot back page AFTER switch
    const after = await screenshotCanvas(page, "user103-after.png");

    const prompt = `You are checking if a text edit was preserved after a page switch in a memorial card editor.

Image 1: The back page (Innen rechts) AFTER editing the name to "Maria Schmidt".
Image 2: The SAME back page AFTER switching to the front page and switching back.

Does Image 2 still show "Maria Schmidt" (or any text containing "Maria Schmidt")?
Or did the edit disappear and revert to the original name?

Score 0-100:
- 100 = "Maria Schmidt" is clearly visible in Image 2 (state preserved)
- 50 = Text is partially changed or unclear
- 0 = The name reverted to the original (state lost)

Return JSON only: { "score": N, "state_preserved": true/false, "summary": "..." }`;

    const beforeBuf = await addGridAxes(before, path.join(OUT, "grid-user103-before.png"));
    const afterBuf = await addGridAxes(after, path.join(OUT, "grid-user103-after.png"));
    const r = await scoreWithMedian([beforeBuf, afterBuf], prompt, "user103");
    record("USER-103", "Name edit preserved (front switch)", r.score, r);
    await page.close();
  }

  // ---------- USER-104: Edit name, switch to Aussen links, switch back ----------
  {
    console.log("--- USER-104: Edit name, switch outside, switch back ---");
    const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
    await loadTemplate(page, "TI05");

    await navBtn(page, "Innen rechts").click();
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      const canvases = document.querySelectorAll("canvas.lower-canvas");
      for (const c of canvases) {
        const fc = c.__fabricCanvas;
        if (!fc) continue;
        for (const obj of fc.getObjects()) {
          if (obj.type === "textbox" && obj.text && /Muster/i.test(obj.text)) {
            obj.set("text", obj.text.replace(/\w+\s+Muster\w*/i, "Maria Schmidt"));
            fc.renderAll();
            fc.fire("object:modified", { target: obj });
            return true;
          }
        }
      }
      return false;
    });
    await page.waitForTimeout(1000);

    const before = await screenshotCanvas(page, "user104-before.png");

    // Switch to outside (Aussen links)
    await navBtn(page, "Au\u00dfen links").click();
    await page.waitForTimeout(2000);

    // Switch back
    await navBtn(page, "Innen rechts").click();
    await page.waitForTimeout(1500);

    const after = await screenshotCanvas(page, "user104-after.png");

    const prompt = `You are checking if a text edit was preserved after switching to the outside spread and back.

Image 1: Back page after editing name to "Maria Schmidt".
Image 2: Same page after switching to outside spread (Aussen links) and back.

Does Image 2 still show "Maria Schmidt"?

Score 0-100:
- 100 = "Maria Schmidt" visible (state preserved)
- 0 = Name reverted (state lost)

Return JSON only: { "score": N, "state_preserved": true/false, "summary": "..." }`;

    const beforeBuf = await addGridAxes(before, path.join(OUT, "grid-user104-before.png"));
    const afterBuf = await addGridAxes(after, path.join(OUT, "grid-user104-after.png"));
    const r = await scoreWithMedian([beforeBuf, afterBuf], prompt, "user104");
    record("USER-104", "Name edit preserved (outside switch)", r.score, r);
    await page.close();
  }

  // ---------- USER-105: Upload cover on outside, switch to front, switch back ----------
  {
    console.log("--- USER-105: Cover photo preserved after page switch ---");
    const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
    await loadTemplate(page, "TI05");

    // Navigate to outside spread
    await navBtn(page, "Au\u00dfen links").click();
    await page.waitForTimeout(1500);

    // Upload cover photo
    await uploadCoverPhoto(page);
    const before = await screenshotCanvas(page, "user105-before.png");

    // Switch to front page
    await navBtn(page, "Innen links").click();
    await page.waitForTimeout(2000);

    // Switch back to outside
    await navBtn(page, "Au\u00dfen links").click();
    await page.waitForTimeout(1500);

    const after = await screenshotCanvas(page, "user105-after.png");

    const prompt = `You are checking if a cover photo upload was preserved after switching pages.

Image 1: Outside spread AFTER uploading a photo of an elderly woman.
Image 2: Same outside spread AFTER switching to the front page and switching back.

Does Image 2 still show the uploaded woman photo? Or did it revert to the default forest/tree scene?

Score 0-100:
- 100 = Woman photo is still visible in Image 2 (same as Image 1)
- 50 = Some photo is visible but unclear if it's the same
- 0 = Photo reverted to default or disappeared

Return JSON only: { "score": N, "state_preserved": true/false, "summary": "..." }`;

    const beforeBuf = await addGridAxes(before, path.join(OUT, "grid-user105-before.png"));
    const afterBuf = await addGridAxes(after, path.join(OUT, "grid-user105-after.png"));
    const r = await scoreWithMedian([beforeBuf, afterBuf], prompt, "user105");
    record("USER-105", "Cover photo preserved after switch", r.score, r);
    await page.close();
  }

  // ---------- USER-109: Edit font, switch page, switch back ----------
  {
    console.log("--- USER-109: Font change preserved after page switch ---");
    const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
    await loadTemplate(page, "TI05");

    await navBtn(page, "Innen rechts").click();
    await page.waitForTimeout(1500);

    // Change font on the name textbox to something visually distinct
    const originalFont = await page.evaluate(() => {
      const canvases = document.querySelectorAll("canvas.lower-canvas");
      for (const c of canvases) {
        const fc = c.__fabricCanvas;
        if (!fc) continue;
        for (const obj of fc.getObjects()) {
          if (obj.type === "textbox" && obj.text && /Muster/i.test(obj.text)) {
            const orig = obj.fontFamily;
            // Switch to a visually distinct font
            const newFont = orig?.includes("Garamond") ? "Arial" : "Courier New";
            obj.set("fontFamily", newFont);
            fc.renderAll();
            fc.fire("object:modified", { target: obj });
            return { original: orig, changed: newFont };
          }
        }
      }
      return null;
    });
    console.log(`    Font changed: ${originalFont?.original} -> ${originalFont?.changed}`);
    await page.waitForTimeout(1000);

    const before = await screenshotCanvas(page, "user109-before.png");

    await navBtn(page, "Innen links").click();
    await page.waitForTimeout(2000);
    await navBtn(page, "Innen rechts").click();
    await page.waitForTimeout(1500);

    const after = await screenshotCanvas(page, "user109-after.png");

    // Also verify the font via Fabric.js
    const fontAfter = await page.evaluate(() => {
      const canvases = document.querySelectorAll("canvas.lower-canvas");
      for (const c of canvases) {
        const fc = c.__fabricCanvas;
        if (!fc) continue;
        for (const obj of fc.getObjects()) {
          if (obj.type === "textbox" && obj.text && /Muster/i.test(obj.text)) {
            return obj.fontFamily;
          }
        }
      }
      return null;
    });
    console.log(`    Font after switch back: ${fontAfter}`);

    const prompt = `You are checking if a font change was preserved after a page switch in a memorial card editor.

Image 1: Back page AFTER changing the font of the name text (the text should look different from the default serif/elegant font — it might be in a monospace like Courier New or a sans-serif like Arial).
Image 2: Same page AFTER switching away and back.

Do both images show the SAME font style? Compare the visual appearance of the text — is the font in Image 2 the same as Image 1?

Score 0-100:
- 100 = Font is clearly the same in both images (state preserved)
- 50 = Hard to tell if the font changed
- 0 = Font clearly reverted to the original elegant style (state lost)

Return JSON only: { "score": N, "font_preserved": true/false, "summary": "..." }`;

    const beforeBuf = await addGridAxes(before, path.join(OUT, "grid-user109-before.png"));
    const afterBuf = await addGridAxes(after, path.join(OUT, "grid-user109-after.png"));
    const r = await scoreWithMedian([beforeBuf, afterBuf], prompt, "user109");
    record("USER-109", "Font change preserved after switch", r.score, r);
    await page.close();
  }

  // ═══════════════════════════════════════════════════════════
  // PART 2: COVER PHOTO IN PREVIEW/PDF (USER-111 to USER-116)
  // ═══════════════════════════════════════════════════════════

  console.log("=".repeat(60));
  console.log("PART 2: COVER PHOTO IN PREVIEW/PDF");
  console.log("=".repeat(60) + "\n");

  // ---------- USER-111/112: TI05 cover photo in preview and PDF ----------
  {
    console.log("--- USER-111: Cover photo visible in preview ---");
    console.log("--- USER-112: Cover photo visible in PDF ---");
    const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
    await loadTemplate(page, "TI05");

    // Navigate to outside spread
    await navBtn(page, "Au\u00dfen links").click();
    await page.waitForTimeout(1500);

    // Upload cover photo
    await uploadCoverPhoto(page);
    const canvasShot = await screenshotCanvas(page, "user111-canvas.png");

    // Open preview
    await openPreview(page);
    const previewShot = await screenshotPreviewIframe(page, "user111-preview.png");
    await closePreview(page);

    // Score preview
    const previewPrompt = `You are checking if a custom uploaded photo appears in the preview of a memorial card.

Image 1: Canvas editor showing the outside spread AFTER uploading a photo of an elderly woman (Woman.jpg — shows a woman, not a forest/tree scene).
Image 2: Preview modal of the same card.

The outside spread in the preview should show the uploaded WOMAN photo (an elderly woman), NOT the default forest/tree scene.

Score 0-100:
- 100 = Woman photo clearly visible in the preview outside section
- 50 = Some photo visible but unclear
- 0 = Default forest/tree scene is shown instead of the woman (upload not reflected in preview)

Return JSON only: { "score": N, "woman_visible": true/false, "shows_default_forest": true/false, "summary": "..." }`;

    const canvasBuf = await addGridAxes(canvasShot, path.join(OUT, "grid-user111-canvas.png"));
    const previewBuf = await addGridAxes(previewShot, path.join(OUT, "grid-user111-preview.png"));
    const r1 = await scoreWithMedian([canvasBuf, previewBuf], previewPrompt, "user111");
    record("USER-111", "Cover photo in preview (TI05)", r1.score, r1);

    // Download PDF
    console.log("  Downloading PDF for USER-112...");
    const pdfPath = await downloadPdf(page, "user112-cover.pdf");
    const pngPaths = await renderPdfPagesToPng(browser, pdfPath);

    if (pngPaths.length > 0) {
      const pdfPage1Buf = await addGridAxes(pngPaths[0], path.join(OUT, "grid-user112-pdf-p1.png"));

      const pdfPrompt = `You are checking if a custom uploaded photo appears in the PDF of a memorial card.

This is PAGE 1 of the PDF (outside spread). It should show an uploaded photo of an ELDERLY WOMAN, NOT the default forest/tree/nature scene.

Does this page show a woman or a forest scene?

Score 0-100:
- 100 = Elderly woman photo is clearly visible
- 50 = Some photo visible but unclear
- 0 = Default forest/tree scene is shown (upload not in PDF)

Return JSON only: { "score": N, "woman_visible": true/false, "shows_default_forest": true/false, "summary": "..." }`;

      const r2 = await scoreWithMedian([pdfPage1Buf], pdfPrompt, "user112");
      record("USER-112", "Cover photo in PDF (TI05)", r2.score, r2);
    } else {
      record("USER-112", "Cover photo in PDF (TI05)", 0, { summary: "PDF render failed" });
    }

    await page.close();
  }

  // ---------- USER-113/114: Halbbild + custom cover ----------
  {
    console.log("--- USER-113: Halbbild preview with custom cover ---");
    console.log("--- USER-114: Halbbild PDF with custom cover ---");
    const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
    await loadTemplate(page, "TI05");

    // Navigate to outside, upload cover
    await navBtn(page, "Au\u00dfen links").click();
    await page.waitForTimeout(1500);
    await uploadCoverPhoto(page);

    // Switch to Halbbild
    const halbbildBtn = navBtn(page, "Halbbild");
    await halbbildBtn.click();
    await page.waitForTimeout(1500);
    const halbCanvas = await screenshotCanvas(page, "user113-halbbild-canvas.png");

    // Preview
    await openPreview(page);
    const halbPreview = await screenshotPreviewIframe(page, "user113-halbbild-preview.png");
    await closePreview(page);

    const previewPrompt = `You are checking a Halbbild (half-image) mode preview of a memorial card.

Image 1: Canvas in Halbbild mode after uploading a woman photo.
Image 2: Preview in Halbbild mode.

In Halbbild mode, the outside spread should show:
- LEFT HALF: The uploaded woman photo (NOT the default forest)
- RIGHT HALF: White/blank area

Score 0-100:
- Image shows woman on left half, white right half: 100
- Shows woman but covers full width: 50
- Shows default forest instead of woman: 20
- No photo at all: 0

Return JSON only: { "score": N, "woman_on_left": true/false, "right_half_blank": true/false, "summary": "..." }`;

    const canvasBuf = await addGridAxes(halbCanvas, path.join(OUT, "grid-user113-canvas.png"));
    const previewBuf = await addGridAxes(halbPreview, path.join(OUT, "grid-user113-preview.png"));
    const r1 = await scoreWithMedian([canvasBuf, previewBuf], previewPrompt, "user113");
    record("USER-113", "Halbbild preview with custom cover", r1.score, r1);

    // PDF
    const pdfPath = await downloadPdf(page, "user114-halbbild.pdf");
    const pngPaths = await renderPdfPagesToPng(browser, pdfPath);

    if (pngPaths.length > 0) {
      const pdfBuf = await addGridAxes(pngPaths[0], path.join(OUT, "grid-user114-pdf-p1.png"));

      const pdfPrompt = `You are checking a Halbbild (half-image) mode PDF page 1 of a memorial card.

In Halbbild mode, page 1 should show:
- LEFT HALF: The uploaded WOMAN photo (elderly woman, NOT a forest)
- RIGHT HALF: White/blank area

Does this page show the woman on the left half and white on the right half?

Score 0-100:
- Woman on left half, white right half: 100
- Woman visible but full width: 50
- Default forest instead of woman: 20
- No photo: 0

Return JSON only: { "score": N, "woman_on_left": true/false, "right_half_blank": true/false, "summary": "..." }`;

      const r2 = await scoreWithMedian([pdfBuf], pdfPrompt, "user114");
      record("USER-114", "Halbbild PDF with custom cover", r2.score, r2);
    } else {
      record("USER-114", "Halbbild PDF with custom cover", 0, { summary: "PDF render failed" });
    }

    await page.close();
  }

  // ---------- USER-115/116: TI04 text-only — cover photo should NOT leak ----------
  {
    console.log("--- USER-115: TI04 text-only — no photo leak in preview ---");
    console.log("--- USER-116: TI04 text-only — no photo leak in PDF ---");
    const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });

    try {
      await loadTemplate(page, "TI04");
    } catch (err) {
      console.log(`  WARNING: ${err.message} — trying alternate approach`);
      // TI04 might be a single card, try loading differently
      await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1000);
      await page.locator('[data-testid="card-type-sterbebild"]').click({ timeout: 5000 });
      await page.waitForTimeout(500);
      // Look for TI04 again
      const ti04 = page.locator('[data-testid="template-TI04"]');
      if (await ti04.isVisible({ timeout: 5000 }).catch(() => false)) {
        await ti04.click();
        await page.waitForTimeout(4000);
      } else {
        console.log("  SKIP: TI04 not available in builder-v2");
        record("USER-115", "TI04 no photo leak in preview", 0, { summary: "TI04 template not found" });
        record("USER-116", "TI04 no photo leak in PDF", 0, { summary: "TI04 template not found" });
        await page.close();
        // Jump to summary
        await browser.close();
        printSummary(results);
        return;
      }
    }

    // Upload cover photo (on whatever page we're on)
    await uploadCoverPhoto(page);

    // Open preview
    await openPreview(page);
    const previewShot = await screenshotPreviewIframe(page, "user115-preview.png");
    await closePreview(page);

    const previewPrompt = `You are checking that a text-only template (TI04) does NOT show an uploaded photo in the wrong section.

This is the preview of a single-sided memorial card template (text-only). A user uploaded a woman photo, but the INSIDE section (text area) should show TEXT ONLY — no photo should appear in the text area.

If the template has a dedicated photo area (cover), the woman should ONLY appear there.
If the template is text-only, NO photo should appear at all.

Score 0-100:
- 100 = Text sections show only text, no photo leak
- 50 = Photo partially visible in text area
- 0 = Photo fully leaked into text-only area

Return JSON only: { "score": N, "photo_leak_detected": true/false, "summary": "..." }`;

    const previewBuf = await addGridAxes(previewShot, path.join(OUT, "grid-user115-preview.png"));
    const r1 = await scoreWithMedian([previewBuf], previewPrompt, "user115");
    record("USER-115", "TI04 no photo leak in preview", r1.score, r1);

    // PDF
    const pdfPath = await downloadPdf(page, "user116-ti04.pdf");
    const pngPaths = await renderPdfPagesToPng(browser, pdfPath);

    if (pngPaths.length >= 2) {
      // Check pages 2-3 (inner pages) — should be text only
      const innerPageBufs = [];
      for (let i = 1; i < pngPaths.length; i++) {
        const buf = await addGridAxes(pngPaths[i], path.join(OUT, `grid-user116-pdf-p${i + 1}.png`));
        innerPageBufs.push(buf);
      }

      const pdfPrompt = `You are checking that inner pages of a text-only memorial card PDF do NOT contain a leaked photo.

These are the INNER pages of a single-sided text-only template (TI04). They should show TEXT ONLY — names, dates, quotes, etc. NO photo of a woman or any image should appear.

Score 0-100:
- 100 = Text only, no photos visible
- 50 = Some image partially visible
- 0 = Photo clearly visible in text-only pages

Return JSON only: { "score": N, "photo_leak_detected": true/false, "summary": "..." }`;

      const r2 = await scoreWithMedian(innerPageBufs, pdfPrompt, "user116");
      record("USER-116", "TI04 no photo leak in PDF", r2.score, r2);
    } else if (pngPaths.length === 1) {
      // Single page card — check it
      const buf = await addGridAxes(pngPaths[0], path.join(OUT, "grid-user116-pdf-p1.png"));

      const pdfPrompt = `This is a single-page text-only memorial card PDF. A photo was uploaded but this template is text-only.
Should show text content (names, dates, quotes) but NO photo of a woman should leak in.

Score 0-100:
- 100 = Text only, no photos
- 0 = Photo visible

Return JSON only: { "score": N, "photo_leak_detected": true/false, "summary": "..." }`;

      const r2 = await scoreWithMedian([buf], pdfPrompt, "user116");
      record("USER-116", "TI04 no photo leak in PDF", r2.score, r2);
    } else {
      record("USER-116", "TI04 no photo leak in PDF", 0, { summary: "PDF render failed" });
    }

    await page.close();
  }

  await browser.close();
  printSummary(results);
}

function printSummary(results) {
  console.log("\n" + "=".repeat(60));
  console.log("FINAL RESULTS — QA STATE & COVER (USER-103 to USER-116)");
  console.log("=".repeat(60));

  let passCount = 0, failCount = 0;
  for (const r of results) {
    const tag = r.pass ? "PASS" : "FAIL";
    if (r.pass) passCount++; else failCount++;
    console.log(`  ${tag}  ${r.id}: ${r.name} = ${r.score}/100`);
  }

  console.log();
  console.log(`Threshold: ${THRESHOLD}/100`);
  console.log(`Results: ${passCount} passed, ${failCount} failed`);
  console.log(`Verdict: ${failCount === 0 ? "ALL PASS" : "FAILED"}`);
  console.log(`Screenshots: ${OUT}`);

  fs.writeFileSync(
    path.join(OUT, "summary.json"),
    JSON.stringify({ threshold: THRESHOLD, passCount, failCount, results }, null, 2)
  );

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  console.error(err.stack);
  process.exit(1);
});
