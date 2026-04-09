/**
 * Visual E2E test for bifold card using Gemini 3.1 Pro scoring.
 *
 * Captures screenshots of ALL canvas views + preview iframe,
 * sends pairs to Gemini for visual comparison scoring.
 *
 * Tests:
 *   A: Outside spread canvas vs preview outside section
 *   B: Inside spread canvas (left+right) vs preview inside section
 *   C: Halbbild mode — cover on left half only
 *
 * Pass threshold: >= 80/100 (median of 3 runs per test)
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { callGeminiWithRetry } from './lib/gemini-keys.mjs';

const BASE = "http://localhost:3002/de/builder-v2";

const MODEL = "gemini-3.1-pro-preview";
const OUT = path.join(process.cwd(), "test-results", "bifold-visual");
fs.mkdirSync(OUT, { recursive: true });

const THRESHOLD = 80;

// ── Grid axes (copied from gemini-score-preview.mjs) ──

async function addGridAxes(imagePath, outputPath) {
  const img = await loadImage(imagePath);
  const srcW = img.width, srcH = img.height;
  const margin = 40;
  const canvasW = srcW + margin;
  const canvasH = srcH + margin;

  const canvas = createCanvas(canvasW, canvasH);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasW, canvasH);
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
      console.error(`    Run ${i + 1}: ERROR — ${err.message}`);
      scores.push({ score: 0, summary: `Error: ${err.message}` });
    }
  }
  console.log();
  scores.sort((a, b) => a.score - b.score);
  const median = scores[1]; // middle of 3
  fs.writeFileSync(
    path.join(OUT, `${label}-result.json`),
    JSON.stringify({ label, runs: scores, median }, null, 2)
  );
  return median;
}

// ── Screenshot helpers ──

async function screenshotCanvas(page, filename) {
  const canvasEl = page.locator("canvas").first();
  if (await canvasEl.isVisible({ timeout: 3000 }).catch(() => false)) {
    const p = path.join(OUT, filename);
    await canvasEl.screenshot({ path: p });
    return p;
  }
  // fallback: screenshot entire page
  const p = path.join(OUT, filename);
  await page.screenshot({ path: p });
  return p;
}

async function screenshotPreviewIframe(page, filename) {
  const p = path.join(OUT, filename);

  // Strategy 1: get iframe content frame and screenshot body
  const iframe = page.locator('iframe[title="Kartenvorschau"]').first();
  if (await iframe.isVisible({ timeout: 5000 }).catch(() => false)) {
    try {
      const iframeContent = iframe.contentFrame();
      await iframeContent.waitForLoadState("load");
      // Wait for any rendering inside the iframe
      await page.waitForTimeout(2000);
      await iframeContent.locator("body").screenshot({ path: p });
      console.log(`    Iframe body screenshot: ${filename}`);
      return p;
    } catch (e) {
      console.log(`    Iframe body failed (${e.message}), falling back to element screenshot`);
    }

    // Strategy 2: screenshot the iframe element itself
    try {
      await iframe.screenshot({ path: p });
      console.log(`    Iframe element screenshot: ${filename}`);
      return p;
    } catch (e2) {
      console.log(`    Iframe element failed (${e2.message}), using full page`);
    }
  }

  // Strategy 3: full page
  await page.screenshot({ path: p, fullPage: true });
  console.log(`    Full page screenshot (fallback): ${filename}`);
  return p;
}

// ── Main ──

async function main() {
  console.log("=== BIFOLD VISUAL E2E — Gemini 3.1 Pro Scoring ===\n");
  console.log(`Output: ${OUT}`);
  console.log(`Threshold: ${THRESHOLD}/100\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });

  // ── Load builder with TI05 ──
  console.log("Phase 0: Loading builder with TI05...");
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1000);

  // Select Sterbebild
  const sterbeBtn = page.locator('[data-testid="card-type-sterbebild"]');
  await sterbeBtn.click({ timeout: 5000 });
  await page.waitForTimeout(500);

  // Select TI05
  const ti05 = page.locator('[data-testid="template-TI05"]');
  if (!(await ti05.isVisible({ timeout: 5000 }).catch(() => false))) {
    console.error("FATAL: TI05 template not found");
    await browser.close();
    process.exit(1);
  }
  await ti05.click();
  await page.waitForTimeout(4000); // wait for Fabric.js canvas
  console.log("  TI05 loaded.\n");

  // ── Phase 1: Capture all screenshots ──
  console.log("Phase 1: Capturing screenshots...\n");

  // Nav buttons
  const aussenLinksBtn = page.locator("button").filter({ hasText: "Außen links" }).first();
  const innenLinksBtn = page.locator("button").filter({ hasText: "Innen links" }).first();
  const innenRechtsBtn = page.locator("button").filter({ hasText: "Innen rechts" }).first();
  const previewBtn = page.locator("button").filter({ hasText: /Vorschau/ }).first();
  const vollbildBtn = page.locator("button").filter({ hasText: "Vollbild" }).first();
  const halbbildBtn = page.locator("button").filter({ hasText: "Halbbild" }).first();

  // 1. Outside spread (Aussen links) — should be default
  console.log("  [1] Aussen links canvas...");
  await aussenLinksBtn.click().catch(() => {}); // ensure we're on it
  await page.waitForTimeout(1500);
  const outsideCanvasPath = await screenshotCanvas(page, "01-aussen-links-canvas.png");

  // 2. Innen links
  console.log("  [2] Innen links canvas...");
  await innenLinksBtn.click();
  await page.waitForTimeout(1500);
  const innerLeftCanvasPath = await screenshotCanvas(page, "02-innen-links-canvas.png");

  // 3. Innen rechts
  console.log("  [3] Innen rechts canvas...");
  await innenRechtsBtn.click();
  await page.waitForTimeout(1500);
  const innerRightCanvasPath = await screenshotCanvas(page, "03-innen-rechts-canvas.png");

  // 4. Open preview (Vollbild mode — default)
  console.log("  [4] Opening Vollbild preview...");
  await aussenLinksBtn.click(); // go back to outside
  await page.waitForTimeout(1000);

  await previewBtn.click();
  await page.waitForTimeout(5000); // wait for preview render

  // 5. Preview iframe
  console.log("  [5] Preview iframe (full content)...");
  const previewFullPath = await screenshotPreviewIframe(page, "04-preview-vollbild-full.png");

  // Take screenshot of just the modal overlay area (what the user actually sees)
  const modalOverlay = page.locator(".fixed.inset-0.z-50").first();
  if (await modalOverlay.isVisible().catch(() => false)) {
    await modalOverlay.screenshot({ path: path.join(OUT, "04-preview-vollbild-modal.png") });
    console.log("    Modal screenshot: 04-preview-vollbild-modal.png");
  }
  // Also take full page screenshot for context
  await page.screenshot({ path: path.join(OUT, "04-preview-vollbild-page.png"), fullPage: true });

  // Close preview
  const closeBtn = page.locator("button").filter({ hasText: /Zurück zur Gestaltung/ }).first();
  if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(1000);
  } else {
    // Try pressing Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);
  }

  // 6. Switch to Halbbild and capture
  console.log("  [6] Switching to Halbbild mode...");
  await aussenLinksBtn.click().catch(() => {});
  await page.waitForTimeout(500);
  await halbbildBtn.click();
  await page.waitForTimeout(1500);
  const halbbildCanvasPath = await screenshotCanvas(page, "05-halbbild-canvas.png");

  // 7. Halbbild preview
  console.log("  [7] Opening Halbbild preview...");
  await previewBtn.click();
  await page.waitForTimeout(5000);
  const halbbildPreviewPath = await screenshotPreviewIframe(page, "06-halbbild-preview.png");

  // Close preview
  if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(500);
  } else {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  }

  console.log("\n  All screenshots captured.\n");

  // ── Phase 2: Score with Gemini ──
  console.log("Phase 2: Sending to Gemini for scoring...\n");

  // Add grid axes to all images
  const outsideCanvasGrid = await addGridAxes(outsideCanvasPath, path.join(OUT, "grid-01-aussen-canvas.png"));
  const innerLeftGrid = await addGridAxes(innerLeftCanvasPath, path.join(OUT, "grid-02-innen-links.png"));
  const innerRightGrid = await addGridAxes(innerRightCanvasPath, path.join(OUT, "grid-03-innen-rechts.png"));
  // Use modal screenshot if available (cleaner — no UI leaking through)
  const modalPath = path.join(OUT, "04-preview-vollbild-modal.png");
  const previewForScoring = fs.existsSync(modalPath) ? modalPath : previewFullPath;
  const previewFullGrid = await addGridAxes(previewForScoring, path.join(OUT, "grid-04-preview-full.png"));
  const halbbildCanvasGrid = await addGridAxes(halbbildCanvasPath, path.join(OUT, "grid-05-halbbild-canvas.png"));
  const halbbildPreviewGrid = await addGridAxes(halbbildPreviewPath, path.join(OUT, "grid-06-halbbild-preview.png"));

  // ── Test A: Outside spread canvas vs preview ──
  console.log("  TEST A: Outside spread (canvas vs preview)");
  const testAPrompt = `You are a STRICT visual quality inspector for memorial cards (Sterbebilder / bifold cards).

Compare these two images WITH RED PERCENTAGE GRID AXES:
- IMAGE 1 = CANVAS (editor showing the outside spread / Aussenseite)
- IMAGE 2 = PREVIEW (what the customer sees as the full bifold preview)

Focus on the OUTSIDE SPREAD section of the preview (the section showing the cover).
The preview should show:
- The SAME cover photo (forest/tree scene) filling the full width (Vollbild mode)
- NO elements from the inner pages leaking into the outside spread
- The aspect ratio should be approximately 4:3 (140x105mm card)

Score 0-100. DEDUCTIONS:
- Cover photo missing or blank: -50
- Cover photo only on half instead of full width (but this is Vollbild mode): -30
- Inner page text visible on outside spread section: -40
- Proportions significantly wrong: -20
- Content cut off or cropped incorrectly: -30

Return JSON only:
{
  "score": N,
  "issues": ["issue1", "issue2"],
  "summary": "one line summary"
}`;

  const testAResult = await scoreWithMedian(
    [outsideCanvasGrid, previewFullGrid],
    testAPrompt,
    "testA-outside-spread"
  );
  console.log(`    MEDIAN: ${testAResult.score}/100 — ${testAResult.summary}\n`);

  // ── Test B: Inside spread canvas vs preview ──
  console.log("  TEST B: Inside spread (canvas left+right vs preview)");
  const testBPrompt = `You are a STRICT visual quality inspector for memorial cards (Sterbebilder / bifold cards).

Compare these THREE images WITH RED PERCENTAGE GRID AXES:
- IMAGE 1 = CANVAS showing the INSIDE LEFT page (Innen links) — should have a photo
- IMAGE 2 = CANVAS showing the INSIDE RIGHT page (Innen rechts) — should have memorial text
- IMAGE 3 = PREVIEW (full bifold preview showing BOTH sides)

Focus on the INSIDE SPREAD section of the preview. The inside section should show TWO panels side by side:
- LEFT panel: Photo (placeholder person or uploaded photo) filling the page
- RIGHT panel: Memorial text (name like "Brigitte Musterfrau", dates, a quote by Albert Schweitzer or similar)

CRITICAL CHECKS — these are the MOST IMPORTANT:
1. Both panels must be FULLY VISIBLE — not cut off at the bottom. If the bottom portion of either panel is missing/cropped/hidden, this is a MAJOR failure.
2. Text must be readable (not too small, not missing)
3. Photo must be present and not blank
4. The two panels together should have approximately 4:3 aspect ratio

Score 0-100. DEDUCTIONS:
- Content cut off at bottom (any panel): -40
- Panel entirely missing: -50
- Text unreadable or missing: -30
- Photo missing or blank: -30
- Wrong proportions: -20

Return JSON only:
{
  "score": N,
  "issues": ["issue1", "issue2"],
  "cut_off_detected": true/false,
  "left_panel_visible": true/false,
  "right_panel_visible": true/false,
  "summary": "one line summary"
}`;

  const testBResult = await scoreWithMedian(
    [innerLeftGrid, innerRightGrid, previewFullGrid],
    testBPrompt,
    "testB-inside-spread"
  );
  console.log(`    MEDIAN: ${testBResult.score}/100 — ${testBResult.summary}`);
  if (testBResult.cut_off_detected) {
    console.log(`    *** CUT-OFF DETECTED — this is the critical bug! ***`);
  }
  console.log();

  // ── Test C: Halbbild mode ──
  console.log("  TEST C: Halbbild mode (half-image cover)");
  const testCPrompt = `You are a STRICT visual quality inspector for memorial cards (Sterbebilder / bifold cards).

Compare these two images WITH RED PERCENTAGE GRID AXES:
- IMAGE 1 = CANVAS in Halbbild mode (cover photo on LEFT HALF only)
- IMAGE 2 = PREVIEW in Halbbild mode

In Halbbild mode, the outside spread section of the preview should show:
- Cover photo on the LEFT HALF only (approximately 50% of the width)
- RIGHT HALF should be WHITE or blank
- There should be a clear visible split at the 50% mark

Score 0-100. DEDUCTIONS:
- Image covers full width instead of only left half: -50
- Right half is NOT white/blank: -30
- No visible split between left and right halves: -20
- Photo missing entirely: -50
- Wrong proportions: -20

Return JSON only:
{
  "score": N,
  "issues": ["issue1", "issue2"],
  "left_half_has_image": true/false,
  "right_half_is_blank": true/false,
  "summary": "one line summary"
}`;

  const testCResult = await scoreWithMedian(
    [halbbildCanvasGrid, halbbildPreviewGrid],
    testCPrompt,
    "testC-halbbild"
  );
  console.log(`    MEDIAN: ${testCResult.score}/100 — ${testCResult.summary}\n`);

  await browser.close();

  // ── Phase 3: Report ──
  console.log("=" .repeat(60));
  console.log("BIFOLD VISUAL TEST RESULTS");
  console.log("=".repeat(60));

  const results = [
    { name: "A: Outside spread", score: testAResult.score, result: testAResult },
    { name: "B: Inside spread", score: testBResult.score, result: testBResult },
    { name: "C: Halbbild mode", score: testCResult.score, result: testCResult },
  ];

  let allPass = true;
  for (const r of results) {
    const verdict = r.score >= THRESHOLD ? "PASS" : "FAIL";
    if (r.score < THRESHOLD) allPass = false;
    console.log(`  ${verdict}  ${r.name}: ${r.score}/100`);
    if (r.result.issues?.length) {
      for (const issue of r.result.issues) {
        console.log(`         - ${issue}`);
      }
    }
    if (r.result.summary) {
      console.log(`         ${r.result.summary}`);
    }
  }

  console.log();
  console.log(`Threshold: ${THRESHOLD}/100`);
  console.log(`Verdict: ${allPass ? "ALL PASS" : "FAILED"}`);
  console.log(`Screenshots: ${OUT}`);
  console.log(`Gemini results: ${OUT}/*.json`);

  // Save overall summary
  fs.writeFileSync(
    path.join(OUT, "summary.json"),
    JSON.stringify({ threshold: THRESHOLD, allPass, results }, null, 2)
  );

  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  console.error(err.stack);
  process.exit(1);
});
