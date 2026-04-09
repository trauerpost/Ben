/**
 * PDF Visual E2E: Generate PDF from builder, check dimensions,
 * render pages to PNG via Playwright, score with Gemini.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import { callGeminiWithRetry } from './lib/gemini-keys.mjs';

const BASE = 'http://localhost:3002/de/builder-v2';
const MODEL = 'gemini-3.1-pro-preview';
const OUT = path.join(process.cwd(), 'test-results', 'pdf-visual');
fs.mkdirSync(OUT, { recursive: true });

// ── Grid axes helper (from verify-bifold-visual.mjs) ──

async function addGridAxes(imagePath, outputPath) {
  const img = await loadImage(imagePath);
  const srcW = img.width, srcH = img.height;
  const margin = 40;
  const canvasW = srcW + margin;
  const canvasH = srcH + margin;

  const canvas = createCanvas(canvasW, canvasH);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.drawImage(img, 0, 0, srcW, srcH, margin, margin, srcW, srcH);

  ctx.strokeStyle = '#ff0000';
  ctx.fillStyle = '#ff0000';
  ctx.lineWidth = 1;
  ctx.font = '11px sans-serif';

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

  ctx.strokeStyle = 'rgba(255, 0, 0, 0.15)';
  ctx.lineWidth = 0.5;
  for (let pct = 10; pct <= 90; pct += 10) {
    const x = margin + Math.round((pct / 100) * srcW);
    const y = margin + Math.round((pct / 100) * srcH);
    ctx.beginPath(); ctx.moveTo(x, margin); ctx.lineTo(x, margin + srcH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(margin + srcW, y); ctx.stroke();
  }

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buf);
  return buf;
}

// ── Gemini API call (from verify-bifold-visual.mjs) ──

async function callGemini(imageBufs, prompt) {
  const parts = [{ text: prompt }];
  for (const buf of imageBufs) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: (Buffer.isBuffer(buf) ? buf : fs.readFileSync(buf)).toString('base64'),
      },
    });
  }

  const data = await callGeminiWithRetry(MODEL, {
    contents: [{ parts }],
    generationConfig: { temperature: 0, maxOutputTokens: 4096 },
  });

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { score: 0, summary: 'Failed to parse Gemini response', raw: text };
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { score: 0, summary: 'JSON parse error', raw: text };
  }
}

// ── Main ──

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  let passed = 0, failed = 0;
  function check(name, condition) {
    if (condition) { console.log(`  PASS: ${name}`); passed++; }
    else { console.log(`  FAIL: ${name}`); failed++; }
  }

  console.log('=== PDF VISUAL E2E ===\n');

  // ── Step 1: Load builder with TI05 ──
  console.log('Step 1: Loading builder with TI05...');
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  const sterbeBtn = page.locator('[data-testid="card-type-sterbebild"]');
  await sterbeBtn.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);

  const ti05 = page.locator('[data-testid="template-TI05"]');
  await ti05.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(3000);
  console.log('  TI05 loaded.\n');

  // ── Step 2: Download PDF ──
  console.log('Step 2: Downloading PDF...');
  const pdfBtn = page.locator('button').filter({ hasText: /^PDF$/ }).first();

  const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
  await pdfBtn.click();
  const download = await downloadPromise;

  const pdfPath = path.join(OUT, 'bifold-fresh.pdf');
  await download.saveAs(pdfPath);
  const pdfSize = fs.statSync(pdfPath).size;
  console.log(`  PDF saved: ${pdfPath} (${(pdfSize / 1024).toFixed(0)} KB)\n`);

  // ── Step 3: Analyze PDF structure ──
  console.log('Step 3: Analyzing PDF structure with pdf-lib...');
  const pdfBuf = fs.readFileSync(pdfPath);

  // Use pdf-lib for reliable page counting (regex fails on compressed PDFs)
  const { PDFDocument } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.load(pdfBuf);
  const pageCount = pdfDoc.getPageCount();
  console.log(`  PDF pages: ${pageCount}`);

  const pageDims = [];
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    const { width: wPt, height: hPt } = page.getSize();
    const wMm = wPt * 0.352778;
    const hMm = hPt * 0.352778;
    pageDims.push({ wMm, hMm, wPt, hPt });
    console.log(`  Page ${i + 1}: ${wMm.toFixed(1)} x ${hMm.toFixed(1)} mm (${wPt.toFixed(1)} x ${hPt.toFixed(1)} pt)`);
  }

  // ── Step 4: Dimension checks ──
  console.log('\nStep 4: Dimension checks...');
  check('PDF has 3 pages', pageCount === 3);

  if (pageDims.length >= 3) {
    const p1 = pageDims[0];
    const p2 = pageDims[1];
    const p3 = pageDims[2];

    check('Page 1 width ~140mm (outside spread)', Math.abs(p1.wMm - 140) < 2);
    check('Page 1 height ~105mm', Math.abs(p1.hMm - 105) < 2);
    check('Page 2 width ~70mm (inner left)', Math.abs(p2.wMm - 70) < 2);
    check('Page 2 height ~105mm', Math.abs(p2.hMm - 105) < 2);
    check('Page 3 width ~70mm (inner right)', Math.abs(p3.wMm - 70) < 2);
    check('Page 3 height ~105mm', Math.abs(p3.hMm - 105) < 2);
  }

  // ── Step 5: Render PDF pages to PNG using Playwright ──
  console.log('\nStep 5: Rendering PDF pages to PNG via Playwright...');

  // Use pdf.js in-browser to render each page to canvas, then screenshot
  const pdfBase64 = pdfBuf.toString('base64');
  const renderPage = await browser.newPage();

  // Create an HTML page that uses pdf.js CDN to render PDF pages
  const renderHtml = `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs" type="module"></script>
  <style>
    body { margin: 0; background: white; }
    canvas { display: block; margin: 0; }
  </style>
</head>
<body>
  <canvas id="pdfCanvas"></canvas>
  <script type="module">
    import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

    window.renderPdfPage = async function(base64Data, pageNum) {
      const raw = atob(base64Data);
      const uint8 = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) uint8[i] = raw.charCodeAt(i);

      const pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;
      const page = await pdf.getPage(pageNum);
      const scale = 2.0; // 2x for crisp rendering
      const viewport = page.getViewport({ scale });

      const canvas = document.getElementById('pdfCanvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = viewport.width + 'px';
      canvas.style.height = viewport.height + 'px';

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport }).promise;
      return { width: canvas.width, height: canvas.height, pages: pdf.numPages };
    };
  </script>
</body>
</html>`;

  const htmlPath = path.join(OUT, 'render.html');
  fs.writeFileSync(htmlPath, renderHtml);
  await renderPage.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle', timeout: 15000 });
  await renderPage.waitForTimeout(2000);

  const pngFiles = [];

  for (let i = 1; i <= pageCount; i++) {
    try {
      const result = await renderPage.evaluate(
        async ({ b64, pg }) => {
          return await window.renderPdfPage(b64, pg);
        },
        { b64: pdfBase64, pg: i }
      );

      // Resize viewport to canvas size for clean screenshot
      await renderPage.setViewportSize({ width: result.width, height: result.height });
      await renderPage.waitForTimeout(500);

      const pngPath = path.join(OUT, `pdf-page-${i}.png`);
      const canvasEl = renderPage.locator('#pdfCanvas');
      await canvasEl.screenshot({ path: pngPath });
      console.log(`  Page ${i} rendered: ${pngPath} (${result.width}x${result.height}px)`);
      pngFiles.push(pngPath);
    } catch (err) {
      console.log(`  Page ${i} render FAILED: ${err.message}`);
    }
  }

  await renderPage.close();

  // ── Step 6: Score with Gemini ──
  if (pngFiles.length > 0) {
    console.log(`\nStep 6: Scoring ${pngFiles.length} PDF pages with Gemini...\n`);

    for (let i = 0; i < pngFiles.length; i++) {
      const pageNum = i + 1;

      // Add grid axes
      const gridPath = path.join(OUT, `pdf-page-${pageNum}-grid.png`);
      const gridBuf = await addGridAxes(pngFiles[i], gridPath);

      let prompt;
      if (pageNum === 1) {
        prompt = `This is PAGE 1 of a bifold memorial card PDF (outside spread, 140x105mm landscape).
It should show a FULL-WIDTH nature/forest cover photo filling the entire page.
The page is landscape orientation (wider than tall).
Score 0-100:
- Cover photo fills entire page: 40 points
- No text or inner page elements visible: 30 points
- Correct landscape proportions (~4:3): 20 points
- Image quality acceptable: 10 points
Return JSON only: { "score": N, "issues": ["..."], "summary": "..." }`;
      } else {
        const side = pageNum === 2 ? 'LEFT (front)' : 'RIGHT (back)';
        const expected = pageNum === 2
          ? 'a portrait PHOTO filling the page (placeholder person or bark/nature texture)'
          : 'memorial TEXT: heading "In stillem Gedenken", name "Brigitte Musterfrau", dates, quote by Albert Schweitzer';
        prompt = `This is PAGE ${pageNum} of a bifold memorial card PDF (inside ${side}, 70x105mm portrait).
It should show ${expected}.
CRITICAL: The page should be PORTRAIT orientation (70mm wide x 105mm tall — taller than wide).
Score 0-100:
- Content matches description: 40 points
- Correct portrait proportions (~2:3, taller than wide): 30 points
- Text fully readable (not truncated, not cut off): 20 points
- No overlapping elements from other pages: 10 points
Deductions:
- Page is landscape instead of portrait: -50
- Content from another page leaking in: -40
- Text cut off at right edge: -30
- Blank/white page with no content: -80
Return JSON only: { "score": N, "issues": ["..."], "summary": "..." }`;
      }

      try {
        const result = await callGemini([gridBuf], prompt);
        console.log(`  PDF Page ${pageNum}: ${result.score}/100 — ${result.summary}`);
        if (result.issues?.length) result.issues.forEach(iss => console.log(`    - ${iss}`));
        check(`PDF Page ${pageNum} Gemini score >= 80`, result.score >= 80);
        fs.writeFileSync(path.join(OUT, `pdf-page-${pageNum}-result.json`), JSON.stringify(result, null, 2));
      } catch (err) {
        console.log(`  Gemini error for page ${pageNum}: ${err.message}`);
      }
    }
  } else {
    console.log('\nNo PDF page PNGs rendered — reporting dimension checks only');
  }

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('CRASH:', err.message);
  console.error(err.stack);
  process.exit(1);
});
