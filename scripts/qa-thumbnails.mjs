/**
 * QA Thumbnails — USER-069 to USER-082
 *
 * Tests thumbnail content verification for ALL 6 bifold templates
 * using Gemini scoring. Each template has 4 page thumbnails in the
 * SpreadNavigator. Single Gemini run per thumbnail for speed.
 *
 * Pass threshold: >= 80/100
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { callGeminiWithRetry } from './lib/gemini-keys.mjs';

const BASE = "http://localhost:3002/de/builder-v2";

const MODEL = "gemini-3.1-pro-preview";
const OUT = path.join(process.cwd(), "test-results", "qa-thumbnails");
fs.mkdirSync(OUT, { recursive: true });

const THRESHOLD = 80;

// ── Template definitions with per-page Gemini criteria ──

const TEMPLATES = [
  {
    id: "TI04",
    name: "Klassisch Elegant",
    tests: [
      { testId: "USER-073", pageIdx: 0, label: "Aussen links",  criteria: "LEFT half of a forest/nature photo (trees, green). Must NOT be blank or white." },
      { testId: "USER-074", pageIdx: 1, label: "Aussen rechts", criteria: "RIGHT half of a forest/nature photo (trees, green). Must NOT be blank or white. Should be the continuation of the left half." },
      { testId: "USER-075", pageIdx: 2, label: "Innen links",   criteria: "Text layout with heading, name in decorative script font (e.g. 'Sieglinde Musterfrau'), dates, and a quote. Must NOT be blank." },
      { testId: "N/A-TI04-back", pageIdx: 3, label: "Innen rechts", criteria: "Back page of a text-only memorial card. May show additional text or be mostly empty with some text elements. Must NOT be a completely white/blank rectangle." },
    ],
  },
  {
    id: "TI05",
    name: "Foto & Gedenken",
    tests: [
      { testId: "USER-069", pageIdx: 0, label: "Aussen links",  criteria: "LEFT half of a forest/nature photo (trees, green). Must NOT be blank or white." },
      { testId: "USER-070", pageIdx: 1, label: "Aussen rechts", criteria: "RIGHT half of a forest/nature photo (trees, green). Must NOT be blank or white. Should be the continuation of the left half." },
      { testId: "USER-071", pageIdx: 2, label: "Innen links",   criteria: "A photo filling the page — could be a placeholder photo (bark, person, nature). Must NOT be blank or white." },
      { testId: "USER-072", pageIdx: 3, label: "Innen rechts",  criteria: "Text layout with heading ('In stillem Gedenken'), name, horizontal lines, quote, and author. Must NOT be blank." },
    ],
  },
  {
    id: "TI06",
    name: "Portrait & Spruch",
    tests: [
      { testId: "N/A-TI06-ol", pageIdx: 0, label: "Aussen links",  criteria: "LEFT half of a forest/nature photo. Must NOT be blank or white." },
      { testId: "N/A-TI06-or", pageIdx: 1, label: "Aussen rechts", criteria: "RIGHT half of a forest/nature photo. Must NOT be blank or white." },
      { testId: "USER-076",    pageIdx: 2, label: "Innen links",   criteria: "L-form layout: photo on the LEFT side (~35% width) and text on the RIGHT side with name and dates. Quote text at the bottom spanning full width. Must NOT be blank." },
      { testId: "N/A-TI06-ir", pageIdx: 3, label: "Innen rechts",  criteria: "Back page with text content (possibly additional memorial text or verse). Must NOT be a completely white/blank rectangle." },
    ],
  },
  {
    id: "TI07",
    name: "Kreuz & Rose",
    tests: [
      { testId: "N/A-TI07-ol", pageIdx: 0, label: "Aussen links",  criteria: "LEFT half of a forest/nature photo. Must NOT be blank or white." },
      { testId: "N/A-TI07-or", pageIdx: 1, label: "Aussen rechts", criteria: "RIGHT half of a forest/nature photo. Must NOT be blank or white." },
      { testId: "USER-077",    pageIdx: 2, label: "Innen links",   criteria: "Cross-rose-vine ornament on the LEFT side, with text (name, dates, locations, divider symbol) on the RIGHT. Must NOT be blank." },
      { testId: "USER-078",    pageIdx: 3, label: "Innen rechts",  criteria: "A photo with rounded corners/clip visible. Must NOT be blank or white." },
    ],
  },
  {
    id: "TI08",
    name: "Ovales Portrait",
    tests: [
      { testId: "N/A-TI08-ol", pageIdx: 0, label: "Aussen links",  criteria: "LEFT half of a forest/nature photo. Must NOT be blank or white." },
      { testId: "N/A-TI08-or", pageIdx: 1, label: "Aussen rechts", criteria: "RIGHT half of a forest/nature photo. Must NOT be blank or white." },
      { testId: "USER-079",    pageIdx: 2, label: "Innen links",   criteria: "A thin cross ornament on the LEFT side (tall, ~full height), with text (name, dates, locations) on the RIGHT. Must NOT be blank." },
      { testId: "USER-080",    pageIdx: 3, label: "Innen rechts",  criteria: "A photo clipped in an oval/ellipse shape. Must NOT be blank or white." },
    ],
  },
  {
    id: "TI09",
    name: "Blumen & Vers",
    tests: [
      { testId: "N/A-TI09-ol", pageIdx: 0, label: "Aussen links",  criteria: "LEFT half of a forest/nature photo. Must NOT be blank or white." },
      { testId: "N/A-TI09-or", pageIdx: 1, label: "Aussen rechts", criteria: "RIGHT half of a forest/nature photo. Must NOT be blank or white." },
      { testId: "USER-081",    pageIdx: 2, label: "Innen links",   criteria: "Floral divider ornament at top, heading text, name, and a photo with rounded clip at the bottom. Must NOT be blank." },
      { testId: "USER-082",    pageIdx: 3, label: "Innen rechts",  criteria: "Quote text (italic), a horizontal line, and a closing verse ('Ruhe in Frieden'). Must NOT be blank or white." },
    ],
  },
];

// ── Gemini API call (single run) ──

async function callGemini(imageBuf, prompt) {
  const parts = [
    { text: prompt },
    {
      inlineData: {
        mimeType: "image/png",
        data: (Buffer.isBuffer(imageBuf) ? imageBuf : fs.readFileSync(imageBuf)).toString("base64"),
      },
    },
  ];

  const data = await callGeminiWithRetry(MODEL, {
    contents: [{ parts }],
    generationConfig: { temperature: 0, maxOutputTokens: 1024 },
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

// ── Build Gemini prompt for a thumbnail ──

function buildPrompt(templateId, templateName, pageLabel, criteria) {
  return `You are a STRICT visual quality inspector for memorial card thumbnails.

You are looking at a SMALL THUMBNAIL image (approximately 64x48 pixels, extracted from a page navigator bar) from the "${templateName}" (${templateId}) template.

This thumbnail represents the "${pageLabel}" page of a bifold memorial card.

EXPECTED CONTENT:
${criteria}

SCORING RULES:
- Score 0-100 based on how well the thumbnail matches the expected content.
- A thumbnail that is COMPLETELY BLANK (all white, all gray, or empty) scores 0.
- A thumbnail that shows SOME content but doesn't match expectations scores 30-60.
- A thumbnail that clearly shows the expected content scores 70-90.
- A thumbnail that perfectly matches gets 90-100.
- Because these are TINY thumbnails, don't penalize for lack of detail — just verify the RIGHT TYPE of content is visible (photo vs text vs ornament vs blank).

DEDUCTIONS:
- Completely blank/white/gray thumbnail: score = 0
- Wrong content type (e.g., text where photo expected): -40
- Very dark or unrecognizable: -30
- Aspect ratio severely wrong: -20

Return JSON only:
{
  "score": N,
  "is_blank": true/false,
  "content_type": "photo|text|ornament|mixed|blank",
  "summary": "one line description of what you see"
}`;
}

// ── Main ──

async function main() {
  console.log("=== QA THUMBNAILS — USER-069 to USER-082 ===");
  console.log(`Output: ${OUT}`);
  console.log(`Threshold: ${THRESHOLD}/100`);
  console.log(`Templates: ${TEMPLATES.map(t => t.id).join(", ")}\n`);

  const browser = await chromium.launch({ headless: true });
  const allResults = {};
  let totalTests = 0;
  let totalPass = 0;
  let totalFail = 0;

  for (const template of TEMPLATES) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`Template: ${template.id} — ${template.name}`);
    console.log("=".repeat(50));

    const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });

    try {
      // Load builder
      console.log("  Loading builder...");
      await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1000);

      // Select Sterbebild
      const sterbeBtn = page.locator('[data-testid="card-type-sterbebild"]');
      await sterbeBtn.click({ timeout: 5000 });
      await page.waitForTimeout(500);

      // Select template
      const tplBtn = page.locator(`[data-testid="template-${template.id}"]`);
      if (!(await tplBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
        console.error(`  FATAL: ${template.id} template not found, skipping`);
        allResults[template.id] = { error: "Template not found" };
        await page.close();
        continue;
      }
      await tplBtn.click();
      await page.waitForTimeout(3000); // wait for canvas render
      console.log(`  ${template.id} loaded.`);

      // Navigate through all 4 pages to generate thumbnails
      console.log("  Navigating all pages to generate thumbnails...");
      const navButtons = page.locator("button").filter({ hasText: /Aussen links|Aussen rechts|Innen links|Innen rechts|Außen links|Außen rechts/ });
      const navCount = await navButtons.count();
      console.log(`  Found ${navCount} nav buttons`);

      // Click each page button to trigger thumbnail generation
      for (let i = 0; i < navCount; i++) {
        const btn = navButtons.nth(i);
        const btnText = await btn.textContent();
        await btn.click();
        await page.waitForTimeout(2000);
        console.log(`    Visited: ${btnText?.trim()}`);
      }

      // Go back to first page
      if (navCount > 0) {
        await navButtons.first().click();
        await page.waitForTimeout(1000);
      }

      // Screenshot the full SpreadNavigator area
      // The SpreadNavigator is the row of thumbnail buttons at the bottom
      const navigatorArea = page.locator("div.flex.items-center.justify-center.gap-3").first();
      if (await navigatorArea.isVisible({ timeout: 3000 }).catch(() => false)) {
        const navScreenshotPath = path.join(OUT, `${template.id}-navigator.png`);
        await navigatorArea.screenshot({ path: navScreenshotPath });
        console.log(`  Navigator screenshot saved: ${template.id}-navigator.png`);
      }

      // Screenshot EACH individual thumbnail button
      // Thumbnails are the button elements inside SpreadNavigator
      const thumbButtons = page.locator("div.flex.items-center.justify-center.gap-3 > button");
      const thumbCount = await thumbButtons.count();
      console.log(`  Found ${thumbCount} thumbnail buttons`);

      const templateResults = [];

      for (const test of template.tests) {
        const idx = test.pageIdx;
        if (idx >= thumbCount) {
          console.log(`  SKIP ${test.testId}: page index ${idx} >= ${thumbCount} buttons`);
          templateResults.push({
            testId: test.testId,
            page: test.label,
            score: 0,
            summary: `Page index ${idx} not found (only ${thumbCount} buttons)`,
            verdict: "FAIL",
          });
          totalTests++;
          totalFail++;
          continue;
        }

        // Screenshot the thumbnail image area (the inner div with the image)
        const thumbBtn = thumbButtons.nth(idx);
        const thumbImgArea = thumbBtn.locator("div.overflow-hidden").first();
        const screenshotName = `${template.id}-thumb-${idx}-${test.label.replace(/\s+/g, "-")}.png`;
        const screenshotPath = path.join(OUT, screenshotName);

        try {
          if (await thumbImgArea.isVisible({ timeout: 2000 }).catch(() => false)) {
            await thumbImgArea.screenshot({ path: screenshotPath });
          } else {
            // Fallback: screenshot the entire button
            await thumbBtn.screenshot({ path: screenshotPath });
          }
        } catch (e) {
          console.log(`  WARNING: Screenshot failed for ${test.label}: ${e.message}`);
          await thumbBtn.screenshot({ path: screenshotPath }).catch(() => {});
        }

        // Send to Gemini
        const prompt = buildPrompt(template.id, template.name, test.label, test.criteria);
        let result;
        try {
          const imgBuf = fs.readFileSync(screenshotPath);
          result = await callGemini(imgBuf, prompt);
        } catch (e) {
          result = { score: 0, summary: `Gemini error: ${e.message}`, is_blank: null };
        }

        const verdict = result.score >= THRESHOLD ? "PASS" : "FAIL";
        if (verdict === "PASS") totalPass++; else totalFail++;
        totalTests++;

        templateResults.push({
          testId: test.testId,
          page: test.label,
          score: result.score,
          is_blank: result.is_blank,
          content_type: result.content_type,
          summary: result.summary,
          verdict,
          screenshot: screenshotName,
        });

        console.log(`  ${verdict}  ${test.testId} ${test.label}: ${result.score}/100 — ${result.summary || ""}`);
      }

      allResults[template.id] = templateResults;
    } catch (err) {
      console.error(`  ERROR processing ${template.id}: ${err.message}`);
      allResults[template.id] = { error: err.message };
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // ── Final Report ──
  console.log("\n" + "=".repeat(60));
  console.log("QA THUMBNAILS — FINAL REPORT");
  console.log("=".repeat(60));

  for (const template of TEMPLATES) {
    const results = allResults[template.id];
    if (!results || results.error) {
      console.log(`\n  ${template.id} (${template.name}): ERROR — ${results?.error || "unknown"}`);
      continue;
    }
    console.log(`\n  ${template.id} (${template.name}):`);
    for (const r of results) {
      const flag = r.score < THRESHOLD ? " <<<< FAIL" : "";
      console.log(`    ${r.verdict}  ${r.page}: ${r.score}/100${r.is_blank ? " [BLANK!]" : ""}${flag}`);
      if (r.summary) console.log(`          ${r.summary}`);
    }
  }

  console.log(`\n  Total: ${totalTests} tests — ${totalPass} PASS, ${totalFail} FAIL`);
  console.log(`  Threshold: ${THRESHOLD}/100`);
  console.log(`  Verdict: ${totalFail === 0 ? "ALL PASS" : "FAILED"}`);
  console.log(`  Screenshots: ${OUT}`);

  // Save results JSON
  const resultsPath = path.join(OUT, "results.json");
  fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    threshold: THRESHOLD,
    totalTests,
    totalPass,
    totalFail,
    verdict: totalFail === 0 ? "ALL PASS" : "FAILED",
    templates: allResults,
  }, null, 2));
  console.log(`  Results JSON: ${resultsPath}`);

  process.exit(totalFail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  console.error(err.stack);
  process.exit(1);
});
