/**
 * QA Text Overflow Tests (USER-117 to USER-123)
 * Verifies inner page text is NOT cut off on canvas for ALL 6 bifold templates.
 *
 * For each template:
 *   1. Load builder, select template
 *   2. Navigate to inner pages with text
 *   3. Screenshot the canvas
 *   4. Send to Gemini for text overflow analysis
 *
 * PASS: score >= 80 AND cut_off_detected === false
 * FAIL: score < 80 OR cut_off_detected === true
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { callGeminiWithRetry } from './lib/gemini-keys.mjs';

const BASE = process.env.BASE_URL || "http://localhost:3002";

const MODEL = "gemini-3.1-pro-preview";
const OUT = path.join(process.cwd(), "test-results", "qa-text-overflow");
fs.mkdirSync(OUT, { recursive: true });

const THRESHOLD = 80;

// ── Template definitions: which pages have text and what text to expect ──

const TEMPLATE_CHECKS = [
  {
    id: "TI04",
    pages: [
      {
        pageButton: "Innen links",   // front page
        pageLabel: "front",
        expectedText: [
          "In liebevoller Erinnerung an",
          "Unsere liebe Mutter, Großmutter",
          "Sieglinde Musterfrau",
          "Was man tief in seinem Herzen besitzt",
          "Johann Wolfgang von Goethe",
          "* 24. Juli 1952",
          "† 28. September 2020",
        ],
        description: "heading, relationship labels, name, quote, author, dates",
      },
    ],
  },
  {
    id: "TI05",
    pages: [
      {
        pageButton: "Innen rechts",  // back page
        pageLabel: "back",
        expectedText: [
          "In stillem Gedenken",
          "Brigitte Musterfrau",
          "* 31. Juli 1950",
          "† 20. Februar 2021",
          "Das schönste Denkmal",
          "(Albert Schweitzer)",
        ],
        description: "heading, name, dates, quote, author",
      },
    ],
  },
  {
    id: "TI06",
    pages: [
      {
        pageButton: "Innen links",   // front page
        pageLabel: "front",
        expectedText: [
          "Thilde Muster",
          "* 4.6.1942",
          "† 6.1.2021",
          "Man sieht die Sonne",
          "langsam untergehen",
        ],
        description: "name, dates, quote",
      },
    ],
  },
  {
    id: "TI07",
    pages: [
      {
        pageButton: "Innen links",   // front page
        pageLabel: "front",
        expectedText: [
          "Franziska",
          "Muster",
          "* 1.12.1954",
          "† 23.1.2021",
          "in Starnberg",
          "in Augsburg",
          "✦  ✦  ✦",
        ],
        description: "name, dates, locations, divider",
      },
    ],
  },
  {
    id: "TI08",
    pages: [
      {
        pageButton: "Innen links",   // front page
        pageLabel: "front",
        expectedText: [
          "Erna",
          "Musterfrau",
          "* 1. 12. 1934",
          "† 20. 1. 2021",
          "in Starnberg",
          "in Augsburg",
        ],
        description: "name, dates, locations",
      },
    ],
  },
  {
    id: "TI09",
    pages: [
      {
        pageButton: "Innen links",   // front page
        pageLabel: "front",
        expectedText: [
          "In liebevoller Erinnerung",
          "Renate Musterfrau",
          "* 6. Mai 1933",
          "† 3. Februar 2021",
        ],
        description: "heading, name, dates",
      },
      {
        pageButton: "Innen rechts",  // back page
        pageLabel: "back",
        expectedText: [
          "Du siehst den Garten nicht mehr grünen",
          "werben dich nie vergessen",
          "Ruhe in Frieden",
        ],
        description: "quote, verse",
      },
    ],
  },
];

// ── Gemini API ──

async function callGemini(imageBuffer, templateId, pageLabel, expectedText) {
  const expectedList = expectedText.map((t) => `"${t}"`).join(", ");

  const prompt = `You are a STRICT text overflow inspector for memorial card templates.

This is the inner page canvas (70mm wide) of a memorial card template ${templateId}, page: ${pageLabel}.

Check that ALL text is FULLY readable — not cut off at the right edge, not truncated.

Expected text content (placeholder data): ${expectedList}

SCORING (0-100):
- All text fully readable and complete: 50 points
- Text within canvas bounds (not overflowing right edge): 30 points
- Text properly formatted (font, alignment, spacing): 20 points

DEDUCTIONS:
- Any text cut off at right edge: -40
- Any text truncated (e.g. 'Brigitte M...' instead of 'Brigitte Musterfrau'): -40
- Text overflowing canvas bottom (hidden below visible area): -20
- Text overlapping other text: -10
- Text too small to read: -10

IMPORTANT: Look carefully at the RIGHT EDGE of the canvas. If any text line
appears to end abruptly or is clipped by the canvas boundary, that is a CUT-OFF.
Also check if any text is pushed below the bottom edge of the canvas.

Return JSON only:
{
  "score": N,
  "issues": ["issue1", "issue2"],
  "template": "${templateId}",
  "page": "${pageLabel}",
  "cut_off_detected": true/false,
  "truncated_texts": ["text that was cut off"],
  "summary": "one line summary"
}`;

  const data = await callGeminiWithRetry(MODEL, {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/png",
              data: imageBuffer.toString("base64"),
            },
          },
        ],
      },
    ],
    generationConfig: { temperature: 0, maxOutputTokens: 4096 },
  });
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { score: 0, summary: "Failed to parse Gemini response", raw: text, cut_off_detected: true };
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { score: 0, summary: "JSON parse error", raw: text, cut_off_detected: true };
  }
}

// ── Median of 3 runs ──

async function scoreWithMedian(imageBuffer, templateId, pageLabel, expectedText, label) {
  const scores = [];
  for (let i = 0; i < 3; i++) {
    try {
      const result = await callGemini(imageBuffer, templateId, pageLabel, expectedText);
      scores.push(result);
      process.stdout.write(`    Run ${i + 1}: ${result.score}/100 (cut_off=${result.cut_off_detected})  `);
    } catch (err) {
      console.error(`    Run ${i + 1}: ERROR — ${err.message}`);
      scores.push({ score: 0, summary: `Error: ${err.message}`, cut_off_detected: true });
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

// ── Screenshot canvas element ──

async function screenshotCanvas(page, filename) {
  const canvasEl = page.locator("canvas").first();
  const p = path.join(OUT, filename);
  if (await canvasEl.isVisible({ timeout: 5000 }).catch(() => false)) {
    await canvasEl.screenshot({ path: p });
    return { path: p, buffer: fs.readFileSync(p) };
  }
  // fallback: full page
  await page.screenshot({ path: p });
  return { path: p, buffer: fs.readFileSync(p) };
}

// ── Main ──

async function main() {
  console.log("=== QA TEXT OVERFLOW — USER-117 to USER-123 ===");
  console.log(`Templates: ${TEMPLATE_CHECKS.map((t) => t.id).join(", ")}`);
  console.log(`Threshold: ${THRESHOLD}/100`);
  console.log(`Output: ${OUT}\n`);

  const browser = await chromium.launch({ headless: true });
  const allResults = [];

  for (const tpl of TEMPLATE_CHECKS) {
    console.log(`\n${"─".repeat(50)}`);
    console.log(`TEMPLATE: ${tpl.id}`);
    console.log(`${"─".repeat(50)}`);

    const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });

    // Load builder
    await page.goto(`${BASE}/de/builder-v2`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1000);

    // Select Sterbebild card type
    const sterbeBtn = page.locator('[data-testid="card-type-sterbebild"]');
    if (!(await sterbeBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.error(`  FATAL: Sterbebild button not found for ${tpl.id}`);
      await page.close();
      allResults.push({ template: tpl.id, page: "all", score: 0, cut_off_detected: true, summary: "Sterbebild button not found" });
      continue;
    }
    await sterbeBtn.click();
    await page.waitForTimeout(500);

    // Select template
    const tplBtn = page.locator(`[data-testid="template-${tpl.id}"]`);
    if (!(await tplBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.error(`  FATAL: Template ${tpl.id} button not found`);
      await page.close();
      allResults.push({ template: tpl.id, page: "all", score: 0, cut_off_detected: true, summary: `Template ${tpl.id} not found` });
      continue;
    }
    await tplBtn.click();
    await page.waitForTimeout(4000); // wait for Fabric.js canvas to render

    console.log(`  Template ${tpl.id} loaded.`);

    // Screenshot initial page for debug
    await page.screenshot({ path: path.join(OUT, `${tpl.id}-full-page.png`) });

    // Test each page
    for (const pageCheck of tpl.pages) {
      console.log(`\n  Page: ${pageCheck.pageLabel} (${pageCheck.description})`);
      console.log(`  Navigating to "${pageCheck.pageButton}"...`);

      // Click the page navigation button
      const navBtn = page.locator("button").filter({ hasText: pageCheck.pageButton }).first();
      if (!(await navBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
        console.error(`    FATAL: Page button "${pageCheck.pageButton}" not found`);
        allResults.push({
          template: tpl.id,
          page: pageCheck.pageLabel,
          score: 0,
          cut_off_detected: true,
          summary: `Page button "${pageCheck.pageButton}" not found`,
        });
        continue;
      }
      await navBtn.click();
      await page.waitForTimeout(2000); // wait for canvas re-render

      // Screenshot the canvas
      const filename = `${tpl.id}-${pageCheck.pageLabel}-canvas.png`;
      const { buffer } = await screenshotCanvas(page, filename);
      console.log(`    Screenshot: ${filename}`);

      // Score with Gemini (median of 3)
      const label = `${tpl.id}-${pageCheck.pageLabel}`;
      const result = await scoreWithMedian(
        buffer,
        tpl.id,
        pageCheck.pageLabel,
        pageCheck.expectedText,
        label
      );

      console.log(`    MEDIAN SCORE: ${result.score}/100`);
      console.log(`    Cut-off detected: ${result.cut_off_detected}`);
      if (result.issues?.length) {
        for (const issue of result.issues) {
          console.log(`    - ${issue}`);
        }
      }
      if (result.truncated_texts?.length) {
        console.log(`    Truncated: ${result.truncated_texts.join(", ")}`);
      }
      console.log(`    Summary: ${result.summary}`);

      allResults.push({
        template: tpl.id,
        page: pageCheck.pageLabel,
        score: result.score,
        cut_off_detected: result.cut_off_detected ?? false,
        issues: result.issues ?? [],
        truncated_texts: result.truncated_texts ?? [],
        summary: result.summary ?? "",
      });
    }

    await page.close();
  }

  await browser.close();

  // ── Final Report ──
  console.log("\n" + "=".repeat(60));
  console.log("  QA TEXT OVERFLOW RESULTS — USER-117 to USER-123");
  console.log("=".repeat(60));

  let allPass = true;
  for (const r of allResults) {
    const scoreFail = r.score < THRESHOLD;
    const cutoffFail = r.cut_off_detected === true;
    const pass = !scoreFail && !cutoffFail;
    if (!pass) allPass = false;

    const verdict = pass ? "PASS" : "FAIL";
    console.log(`  ${verdict}  ${r.template} / ${r.page}: ${r.score}/100 (cut_off=${r.cut_off_detected})`);
    if (r.issues?.length) {
      for (const issue of r.issues) {
        console.log(`         - ${issue}`);
      }
    }
    if (r.truncated_texts?.length) {
      console.log(`         Truncated: ${r.truncated_texts.join(", ")}`);
    }
    if (r.summary) {
      console.log(`         ${r.summary}`);
    }
  }

  console.log();
  console.log(`  Threshold: ${THRESHOLD}/100 AND cut_off_detected must be false`);
  console.log(`  Verdict: ${allPass ? "ALL PASS" : "FAILED"}`);
  console.log(`  Screenshots: ${OUT}`);
  console.log("=".repeat(60));

  // Save summary
  fs.writeFileSync(
    path.join(OUT, "summary.json"),
    JSON.stringify({ threshold: THRESHOLD, allPass, results: allResults, timestamp: new Date().toISOString() }, null, 2)
  );

  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  console.error(err.stack);
  process.exit(1);
});
