#!/usr/bin/env node
/**
 * QA Edit Flow Tests (USER-091 to USER-102)
 * Verify that user edits (text, font, color) appear correctly in Preview AND PDF.
 *
 * Test 1: Edit name → Preview → PDF
 * Test 2: Change font → Preview → PDF
 * Test 3: Change color → Preview → PDF
 *
 * Uses Gemini 3.1 Pro for visual verification with score >= 80 = PASS.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { callGeminiWithRetry } from './lib/gemini-keys.mjs';

const BASE = process.env.BASE_URL || "http://localhost:3002";
const MODEL = "gemini-3.1-pro-preview";
const OUT = path.join(process.cwd(), "test-results", "qa-edit-flow");
fs.mkdirSync(OUT, { recursive: true });

// ── Gemini API helper ──

async function askGemini(imageBuf, question) {
  const data = await callGeminiWithRetry(MODEL, {
    contents: [{
      parts: [
        { text: `${question}\n\nReturn JSON only: { "score": N, "answer": "...", "details": "..." }\nScore 0-100 where 100 = perfectly matches expected, 0 = completely wrong.` },
        { inlineData: { mimeType: "image/png", data: imageBuf.toString("base64") } },
      ],
    }],
    generationConfig: { temperature: 0, maxOutputTokens: 2048 },
  });

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { score: 0, answer: "Failed to parse", details: text };
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { score: 0, answer: "JSON parse error", details: text };
  }
}

// ── PDF rendering helper (uses pdf.js in Playwright) ──

async function renderPdfPageToPng(browser, pdfBuffer, pageNum, outputPath) {
  const pdfBase64 = pdfBuffer.toString("base64");
  const renderPage = await browser.newPage();

  const renderHtml = `<!DOCTYPE html>
<html><head>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs" type="module"></script>
<style>body{margin:0;background:white}canvas{display:block;margin:0}</style>
</head><body>
<canvas id="pdfCanvas"></canvas>
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
  await renderPage.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle", timeout: 15000 });
  await renderPage.waitForTimeout(2000);

  const result = await renderPage.evaluate(
    async ({ b64, pg }) => await window.renderPdfPage(b64, pg),
    { b64: pdfBase64, pg: pageNum }
  );

  await renderPage.setViewportSize({ width: result.width, height: result.height });
  await renderPage.waitForTimeout(500);
  await renderPage.locator("#pdfCanvas").screenshot({ path: outputPath });
  await renderPage.close();
  return result;
}

// ── Fabric canvas helpers ──

async function getFabricObjects(page) {
  return await page.evaluate(() => {
    const canvasEls = document.querySelectorAll("canvas.lower-canvas");
    for (const c of canvasEls) {
      const fc = c.__fabricCanvas ?? c.fabric;
      if (fc) {
        return fc.getObjects().map(obj => ({
          type: obj.type,
          text: obj.text,
          fontFamily: obj.fontFamily,
          fill: obj.fill,
          field: obj.data?.field,
          id: obj.data?.templateElementId ?? obj.id,
        }));
      }
    }
    return [];
  });
}

async function setFabricText(page, fieldName, newText) {
  return await page.evaluate(({ field, text }) => {
    const canvasEls = document.querySelectorAll("canvas.lower-canvas");
    for (const c of canvasEls) {
      const fc = c.__fabricCanvas ?? c.fabric;
      if (!fc) continue;
      const obj = fc.getObjects().find(o => o.data?.field === field);
      if (obj) {
        obj.set("text", text);
        fc.renderAll();
        // Also fire modified event so state updates
        fc.fire("object:modified", { target: obj });
        return true;
      }
    }
    return false;
  }, { field: fieldName, text: newText });
}

async function setFabricFont(page, fieldName, fontFamily) {
  return await page.evaluate(({ field, font }) => {
    const canvasEls = document.querySelectorAll("canvas.lower-canvas");
    for (const c of canvasEls) {
      const fc = c.__fabricCanvas ?? c.fabric;
      if (!fc) continue;
      const obj = fc.getObjects().find(o => o.data?.field === field);
      if (obj) {
        obj.set("fontFamily", font);
        fc.renderAll();
        fc.fire("object:modified", { target: obj });
        return true;
      }
    }
    return false;
  }, { field: fieldName, font: fontFamily });
}

async function setFabricColor(page, fieldName, color) {
  return await page.evaluate(({ field, clr }) => {
    const canvasEls = document.querySelectorAll("canvas.lower-canvas");
    for (const c of canvasEls) {
      const fc = c.__fabricCanvas ?? c.fabric;
      if (!fc) continue;
      const obj = fc.getObjects().find(o => o.data?.field === field);
      if (obj) {
        obj.set("fill", clr);
        fc.renderAll();
        fc.fire("object:modified", { target: obj });
        return true;
      }
    }
    return false;
  }, { field: fieldName, clr: color });
}

// ── Results tracking ──

const results = [];
function record(testId, step, score, details) {
  const pass = score >= 80;
  results.push({ testId, step, score, pass, details });
  console.log(`  ${pass ? "PASS" : "FAIL"}: ${step} — score=${score}/100 — ${details}`);
}

// ── Main ──

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log("=== QA Edit Flow Tests (USER-091 to USER-102) ===\n");
  console.log(`Target: ${BASE}/de/builder-v2\n`);

  // ── Load TI05 ──
  console.log("Loading TI05...");
  await page.goto(`${BASE}/de/builder-v2?_t=${Date.now()}`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1000);

  // Select sterbebild card type
  await page.locator('[data-testid="card-type-sterbebild"]').click({ timeout: 10000 });
  await page.waitForTimeout(500);

  // Select TI05 template
  await page.locator('[data-testid="template-TI05"]').click({ timeout: 10000 });

  // Wait for Fabric.js canvas to fully load
  await page.waitForTimeout(5000);

  // Verify we're in the builder
  const hasCanvas = await page.locator("canvas.lower-canvas").isVisible({ timeout: 5000 });
  if (!hasCanvas) {
    console.error("FATAL: Canvas not found after loading TI05");
    await page.screenshot({ path: path.join(OUT, "fatal-no-canvas.png") });
    await browser.close();
    process.exit(1);
  }
  console.log("  TI05 loaded, canvas visible.\n");

  // ── Navigate to "Innen rechts" (back page with text) ──
  console.log("Navigating to Innen rechts (back page)...");
  // TI05 is bifold with outer pages: tabs are "Außen links", "Außen rechts", "Innen links", "Innen rechts"
  const backTab = page.locator('button:has-text("Innen rechts")').first();
  const backTabVisible = await backTab.isVisible({ timeout: 5000 }).catch(() => false);

  if (!backTabVisible) {
    // Fallback: try "Rückseite" (non-bifold) or "Back"
    const altTab = page.locator('button:has-text("Rückseite")').or(page.locator('button:has-text("Back")'));
    if (await altTab.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await altTab.first().click();
      console.log("  Navigated via Rückseite/Back tab");
    } else {
      console.log("  WARNING: No back page tab found — may already be on back page");
    }
  } else {
    await backTab.click();
    console.log("  Navigated to Innen rechts");
  }
  await page.waitForTimeout(3000);

  // Verify text objects are present on this page
  const objects = await getFabricObjects(page);
  const nameObj = objects.find(o => o.field === "name");
  console.log(`  Canvas objects: ${objects.length} total, name field: ${nameObj ? `"${nameObj.text}"` : "NOT FOUND"}`);
  if (objects.length > 0) {
    console.log(`  All fields: ${objects.filter(o => o.field).map(o => `${o.field}="${o.text?.substring(0, 30) || ""}"`).join(", ")}`);
  }

  await page.screenshot({ path: path.join(OUT, "01-initial-back-page.png") });

  // ════════════════════════════════════════════════════════════════
  // TEST 1: Edit name → Preview → PDF (USER-091 to USER-094)
  // ════════════════════════════════════════════════════════════════
  console.log("\n── TEST 1: Edit name text → Preview → PDF ──");

  // Step 1: Change name text via Fabric API
  const nameSet = await setFabricText(page, "name", "Maria Schmidt");
  console.log(`  Set name to "Maria Schmidt": ${nameSet ? "OK" : "FAILED (field not found)"}`);
  await page.waitForTimeout(1000);

  // Verify the change on canvas
  const afterEdit = await getFabricObjects(page);
  const nameAfter = afterEdit.find(o => o.field === "name");
  console.log(`  Canvas name after edit: "${nameAfter?.text}"`);
  await page.screenshot({ path: path.join(OUT, "02-after-name-edit.png") });

  // Step 2: Open Preview
  console.log("  Opening preview...");
  const previewBtn = page.locator('button:has-text("Vorschau")').or(page.locator('button:has-text("Preview")'));
  await previewBtn.first().click();
  await page.waitForTimeout(6000);

  // Screenshot preview
  await page.screenshot({ path: path.join(OUT, "03-preview-name-edit.png") });

  // Score preview with Gemini
  const previewScreenshot1 = fs.readFileSync(path.join(OUT, "03-preview-name-edit.png"));
  const previewResult1 = await askGemini(
    previewScreenshot1,
    "This is a preview of a memorial card. The name was edited to 'Maria Schmidt'. Look at the text page (the page with memorial text — heading, name, dates, quote). Does it show 'Maria Schmidt' as the name? Or does it still show the default name like 'Brigitte Musterfrau' or something else? Focus on whether 'Maria Schmidt' appears on the card."
  );
  record("TEST1", "Preview shows 'Maria Schmidt'", previewResult1.score, previewResult1.answer);
  fs.writeFileSync(path.join(OUT, "test1-preview-result.json"), JSON.stringify(previewResult1, null, 2));

  // Step 3: Download PDF
  console.log("  Downloading PDF...");
  let pdfBuffer = null;
  try {
    const pdfBtn = page.locator('button:has-text("PDF herunterladen")').or(page.locator('button:has-text("Download PDF")'));
    const pdfBtnVisible = await pdfBtn.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (pdfBtnVisible) {
      const downloadPromise = page.waitForEvent("download", { timeout: 60000 });
      await pdfBtn.first().click();
      const download = await downloadPromise;
      const pdfPath = path.join(OUT, "test1-card.pdf");
      await download.saveAs(pdfPath);
      pdfBuffer = fs.readFileSync(pdfPath);
      console.log(`  PDF downloaded: ${(pdfBuffer.length / 1024).toFixed(0)} KB`);
    } else {
      // Try direct PDF button (some layouts have a "PDF" button)
      const directPdf = page.locator('button').filter({ hasText: /^PDF$/ }).first();
      if (await directPdf.isVisible({ timeout: 3000 }).catch(() => false)) {
        const downloadPromise = page.waitForEvent("download", { timeout: 60000 });
        await directPdf.click();
        const download = await downloadPromise;
        const pdfPath = path.join(OUT, "test1-card.pdf");
        await download.saveAs(pdfPath);
        pdfBuffer = fs.readFileSync(pdfPath);
        console.log(`  PDF downloaded: ${(pdfBuffer.length / 1024).toFixed(0)} KB`);
      } else {
        console.log("  WARNING: PDF download button not found");
      }
    }
  } catch (err) {
    console.log(`  PDF download error: ${err.message?.substring(0, 100)}`);
  }

  // Step 4: Render PDF page 3 and score with Gemini
  if (pdfBuffer) {
    console.log("  Rendering PDF page 3 (text page)...");
    try {
      const pdfPng = path.join(OUT, "test1-pdf-page3.png");
      await renderPdfPageToPng(browser, pdfBuffer, 3, pdfPng);
      const pdfPageBuf = fs.readFileSync(pdfPng);
      const pdfResult1 = await askGemini(
        pdfPageBuf,
        "This is page 3 of a memorial card PDF. It should be the text page with a heading, name, dates, and quote. Does it show 'Maria Schmidt' as the name? Or does it show something else like 'Brigitte Musterfrau'? Focus on whether 'Maria Schmidt' appears."
      );
      record("TEST1", "PDF page 3 shows 'Maria Schmidt'", pdfResult1.score, pdfResult1.answer);
      fs.writeFileSync(path.join(OUT, "test1-pdf-result.json"), JSON.stringify(pdfResult1, null, 2));
    } catch (err) {
      console.log(`  PDF render error: ${err.message?.substring(0, 100)}`);
      // Try page 2 as fallback
      try {
        console.log("  Trying PDF page 2 as fallback...");
        const pdfPng2 = path.join(OUT, "test1-pdf-page2.png");
        await renderPdfPageToPng(browser, pdfBuffer, 2, pdfPng2);
        const pdfPageBuf2 = fs.readFileSync(pdfPng2);
        const pdfResult1b = await askGemini(
          pdfPageBuf2,
          "This is page 2 of a memorial card PDF. Does it show 'Maria Schmidt' as a name anywhere? Or does it show something else?"
        );
        record("TEST1", "PDF page 2 shows 'Maria Schmidt' (fallback)", pdfResult1b.score, pdfResult1b.answer);
      } catch (err2) {
        record("TEST1", "PDF render", 0, `Failed: ${err2.message?.substring(0, 80)}`);
      }
    }
  } else {
    record("TEST1", "PDF download", 0, "PDF not downloaded");
  }

  // Close preview
  const closeBtn = page.locator('button:has-text("Zurück")').or(page.locator('button:has-text("Back")'));
  if (await closeBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await closeBtn.first().click();
    await page.waitForTimeout(2000);
  } else {
    // Try X/close button or ESC
    await page.keyboard.press("Escape");
    await page.waitForTimeout(2000);
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 2: Change font → Preview → PDF (USER-095 to USER-098)
  // ════════════════════════════════════════════════════════════════
  console.log("\n── TEST 2: Change font to 'Great Vibes' → Preview → PDF ──");

  // Ensure we're on the back page
  if (backTabVisible) {
    await backTab.click();
    await page.waitForTimeout(2000);
  }

  // Change font via Fabric API
  const fontSet = await setFabricFont(page, "name", "Great Vibes");
  console.log(`  Set font to "Great Vibes": ${fontSet ? "OK" : "FAILED"}`);
  await page.waitForTimeout(1000);

  // Verify
  const afterFont = await getFabricObjects(page);
  const nameFontAfter = afterFont.find(o => o.field === "name");
  console.log(`  Canvas name font: "${nameFontAfter?.fontFamily}", text: "${nameFontAfter?.text}"`);
  await page.screenshot({ path: path.join(OUT, "04-after-font-change.png") });

  // Open Preview
  console.log("  Opening preview...");
  await previewBtn.first().click();
  await page.waitForTimeout(6000);
  await page.screenshot({ path: path.join(OUT, "05-preview-font-change.png") });

  const previewScreenshot2 = fs.readFileSync(path.join(OUT, "05-preview-font-change.png"));
  const previewResult2 = await askGemini(
    previewScreenshot2,
    "This is a preview of a memorial card. The name 'Maria Schmidt' was set in a script/cursive font called 'Great Vibes'. Look at the text page. Is the name text rendered in a script/cursive/handwriting-style font (flowing, connected letters like calligraphy)? Or is it in a plain serif/sans-serif font like Inter or Arial? Focus on whether the font appears to be a decorative script font."
  );
  record("TEST2", "Preview shows script font (Great Vibes)", previewResult2.score, previewResult2.answer);
  fs.writeFileSync(path.join(OUT, "test2-preview-result.json"), JSON.stringify(previewResult2, null, 2));

  // Download PDF
  let pdfBuffer2 = null;
  try {
    const pdfBtn = page.locator('button:has-text("PDF herunterladen")').or(page.locator('button:has-text("Download PDF")'));
    if (await pdfBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent("download", { timeout: 60000 });
      await pdfBtn.first().click();
      const download = await downloadPromise;
      const pdfPath = path.join(OUT, "test2-card.pdf");
      await download.saveAs(pdfPath);
      pdfBuffer2 = fs.readFileSync(pdfPath);
      console.log(`  PDF downloaded: ${(pdfBuffer2.length / 1024).toFixed(0)} KB`);
    }
  } catch (err) {
    console.log(`  PDF download error: ${err.message?.substring(0, 100)}`);
  }

  if (pdfBuffer2) {
    try {
      const pdfPng = path.join(OUT, "test2-pdf-page3.png");
      await renderPdfPageToPng(browser, pdfBuffer2, 3, pdfPng);
      const pdfPageBuf = fs.readFileSync(pdfPng);
      const pdfResult2 = await askGemini(
        pdfPageBuf,
        "This is a PDF page of a memorial card. The name should be in a script/cursive font (Great Vibes — flowing calligraphy style). Is the name text in a script/cursive/decorative font? Or is it in a plain serif/sans-serif font?"
      );
      record("TEST2", "PDF page 3 shows script font", pdfResult2.score, pdfResult2.answer);
      fs.writeFileSync(path.join(OUT, "test2-pdf-result.json"), JSON.stringify(pdfResult2, null, 2));
    } catch (err) {
      record("TEST2", "PDF render", 0, `Failed: ${err.message?.substring(0, 80)}`);
    }
  } else {
    record("TEST2", "PDF download", 0, "PDF not downloaded");
  }

  // Close preview
  if (await closeBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await closeBtn.first().click();
    await page.waitForTimeout(2000);
  } else {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(2000);
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 3: Change color → Preview → PDF (USER-099 to USER-102)
  // ════════════════════════════════════════════════════════════════
  console.log("\n── TEST 3: Change text color to gold (#8B7D3C) → Preview → PDF ──");

  // Ensure we're on the back page
  if (backTabVisible) {
    await backTab.click();
    await page.waitForTimeout(2000);
  }

  // Change color via Fabric API
  const colorSet = await setFabricColor(page, "name", "#8B7D3C");
  console.log(`  Set color to gold #8B7D3C: ${colorSet ? "OK" : "FAILED"}`);
  await page.waitForTimeout(1000);

  // Verify
  const afterColor = await getFabricObjects(page);
  const nameColorAfter = afterColor.find(o => o.field === "name");
  console.log(`  Canvas name fill: "${nameColorAfter?.fill}", text: "${nameColorAfter?.text}"`);
  await page.screenshot({ path: path.join(OUT, "06-after-color-change.png") });

  // Open Preview
  console.log("  Opening preview...");
  await previewBtn.first().click();
  await page.waitForTimeout(6000);
  await page.screenshot({ path: path.join(OUT, "07-preview-color-change.png") });

  const previewScreenshot3 = fs.readFileSync(path.join(OUT, "07-preview-color-change.png"));
  const previewResult3 = await askGemini(
    previewScreenshot3,
    "This is a preview of a memorial card. The name text color was changed to gold (#8B7D3C — a dark gold/olive-brown color). Look at the text page. Is the name text in a gold/brown/olive color? Or is it still in black? The gold color is distinctive — it's clearly NOT black, it's a warm brownish-gold tone."
  );
  record("TEST3", "Preview shows gold text color", previewResult3.score, previewResult3.answer);
  fs.writeFileSync(path.join(OUT, "test3-preview-result.json"), JSON.stringify(previewResult3, null, 2));

  // Download PDF
  let pdfBuffer3 = null;
  try {
    const pdfBtn = page.locator('button:has-text("PDF herunterladen")').or(page.locator('button:has-text("Download PDF")'));
    if (await pdfBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent("download", { timeout: 60000 });
      await pdfBtn.first().click();
      const download = await downloadPromise;
      const pdfPath = path.join(OUT, "test3-card.pdf");
      await download.saveAs(pdfPath);
      pdfBuffer3 = fs.readFileSync(pdfPath);
      console.log(`  PDF downloaded: ${(pdfBuffer3.length / 1024).toFixed(0)} KB`);
    }
  } catch (err) {
    console.log(`  PDF download error: ${err.message?.substring(0, 100)}`);
  }

  if (pdfBuffer3) {
    try {
      const pdfPng = path.join(OUT, "test3-pdf-page3.png");
      await renderPdfPageToPng(browser, pdfBuffer3, 3, pdfPng);
      const pdfPageBuf = fs.readFileSync(pdfPng);
      const pdfResult3 = await askGemini(
        pdfPageBuf,
        "This is a PDF page of a memorial card. The name text color should be gold (#8B7D3C — a dark brownish-gold color, NOT black). Is the name text in a gold/brown/olive color? Or is it in black? Look carefully at the color of the largest name text."
      );
      record("TEST3", "PDF page 3 shows gold text color", pdfResult3.score, pdfResult3.answer);
      fs.writeFileSync(path.join(OUT, "test3-pdf-result.json"), JSON.stringify(pdfResult3, null, 2));
    } catch (err) {
      record("TEST3", "PDF render", 0, `Failed: ${err.message?.substring(0, 80)}`);
    }
  } else {
    record("TEST3", "PDF download", 0, "PDF not downloaded");
  }

  // ════════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════════
  console.log("\n" + "=".repeat(60));
  console.log("=== QA EDIT FLOW RESULTS ===");
  console.log("=".repeat(60));

  let totalPass = 0, totalFail = 0;
  for (const r of results) {
    const icon = r.pass ? "PASS" : "FAIL";
    console.log(`  [${icon}] ${r.testId} / ${r.step}: ${r.score}/100`);
    console.log(`         ${r.details}`);
    if (r.pass) totalPass++; else totalFail++;
  }

  console.log(`\nTotal: ${totalPass} PASSED, ${totalFail} FAILED out of ${results.length} checks`);
  console.log(`Screenshots and results saved to: ${OUT}`);

  // Save full report
  fs.writeFileSync(path.join(OUT, "full-report.json"), JSON.stringify({ results, totalPass, totalFail }, null, 2));

  await browser.close();
  process.exit(totalFail > 0 ? 1 : 0);
}

main().catch(err => {
  console.error("CRASH:", err.message);
  console.error(err.stack);
  process.exit(1);
});
