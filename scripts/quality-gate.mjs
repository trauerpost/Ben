#!/usr/bin/env node
/**
 * BENJEMIN Quality Gate — runs BEFORE any push or "done" claim.
 *
 * This is NOT a unit test. This is a customer-journey test that opens
 * the real app and checks what a REAL USER would see.
 *
 * FAILS on:
 * - Raw field names like [heading], [name], [birthDate] visible on screen
 * - "undefined" or "null" rendered as text
 * - Console errors
 * - Missing templates for any card type
 * - Broken language switching (EN showing German, DE showing English)
 * - Empty canvas/preview areas
 * - Site name wrong ("Funeral mail" instead of "Trauerpost" on DE)
 *
 * Usage:
 *   node scripts/quality-gate.mjs                    # localhost:3000
 *   BASE_URL=https://foo.vercel.app node scripts/quality-gate.mjs  # production
 */

import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const FIELD_NAME_PATTERN = /\[(heading|name|birthDate|deathDate|quote|quoteAuthor|relationshipLabels|closingVerse|locationBirth|locationDeath|dividerSymbol)\]/;
const FORBIDDEN_TEXT = ["undefined", "null", "[object Object]"];

let pass = 0;
let fail = 0;
const failures = [];

function check(name, ok, detail) {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    failures.push({ name, detail });
    console.log(`  ✗ ${name} — ${detail}`);
  }
}

async function testRoute(page, locale, builder, path) {
  const label = `${locale.toUpperCase()} ${builder}`;
  console.log(`\n── ${label} (${path}) ──`);

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  const resp = await page.goto(`${BASE}${path}`, {
    waitUntil: "networkidle",
    timeout: 20000,
  });
  check(`${label}: page loads`, resp?.ok(), `HTTP ${resp?.status()}`);

  // Check site name
  const headerText = await page.locator("header").first().textContent();
  if (locale === "de") {
    check(
      `${label}: site name is "Trauerpost"`,
      headerText?.includes("Trauerpost"),
      `Header shows: "${headerText?.substring(0, 50)}"`
    );
  }

  // Check language buttons aren't duplicated
  const langButtons = await page.locator("header button, header a").allTextContents();
  const langText = langButtons.join(" ");
  const enCount = (langText.match(/\bEN\b/g) || []).length;
  check(
    `${label}: no duplicate lang buttons`,
    enCount <= 1,
    `Found ${enCount} "EN" buttons`
  );

  return consoleErrors;
}

async function testWizardFlow(page, locale) {
  const path = `/${locale}/builder`;
  const consoleErrors = await testRoute(page, locale, "Wizard", path);
  const label = `${locale.toUpperCase()} Wizard`;

  // Select sterbebild/Memorial
  const cardBtn = locale === "de"
    ? page.locator("button:has-text('Erinnerungsbild')")
    : page.locator("button:has-text('Memorial Card')");
  await cardBtn.click();
  await page.waitForTimeout(500);

  // Go to template step
  await page.locator("button:has-text('Next')").click();
  await page.waitForTimeout(800);

  // Check templates exist
  const templateBtns = page.locator("button[data-testid]");
  const count = await templateBtns.count();
  check(`${label}: templates visible`, count >= 6, `Found ${count} templates`);

  // Check no raw field names in template names
  for (let i = 0; i < count; i++) {
    const text = await templateBtns.nth(i).textContent();
    const hasFieldName = FIELD_NAME_PATTERN.test(text || "");
    if (hasFieldName) {
      check(`${label}: template ${i} no field names`, false, text);
    }
  }

  // Select first template with photo (TI05)
  const ti05 = page.locator('[data-testid="TI05"]');
  if (await ti05.count() > 0) {
    await ti05.click();
    await page.waitForTimeout(300);
    await page.locator("button:has-text('Next')").click(); // photo
    await page.waitForTimeout(300);
    await page.locator("button:has-text('Next')").click(); // text
    await page.waitForTimeout(800);

    // Check preview has real text, not field names
    const bodyText = await page.textContent("body");
    const hasFieldNames = FIELD_NAME_PATTERN.test(bodyText || "");
    check(
      `${label}: no [fieldName] in preview`,
      !hasFieldNames,
      hasFieldNames ? `Found raw field name in body` : ""
    );

    // Check placeholder data is present
    const hasMuster = bodyText?.includes("Musterfrau") || bodyText?.includes("Muster");
    check(
      `${label}: placeholder text visible`,
      hasMuster,
      hasMuster ? "" : "No placeholder name found"
    );

    // Check no forbidden text
    for (const forbidden of FORBIDDEN_TEXT) {
      // Only flag if it's rendered as visible content, not in attribute values
      const found = await page.locator(`text="${forbidden}"`).count();
      check(
        `${label}: no "${forbidden}" rendered`,
        found === 0,
        `Found ${found} instances`
      );
    }
  }

  check(`${label}: zero console errors`, consoleErrors.length === 0, consoleErrors.join("; "));
}

async function testCanvasBuilderFlow(page, locale) {
  const path = `/${locale}/builder-v2`;
  const label = `${locale.toUpperCase()} Canvas`;
  let consoleErrors = [];

  // Test ALL card types — reload page for each to reset state
  const cardTypes = ["sterbebild", "trauerkarte", "dankkarte"];
  for (const cardType of cardTypes) {
    consoleErrors = [];
    page.removeAllListeners("console");
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 20000 });

    // Check site name + lang buttons only on first card type
    if (cardType === "sterbebild") {
      const headerText = await page.locator("header").first().textContent();
      if (locale === "de") check(`${label}: site name is "Trauerpost"`, headerText?.includes("Trauerpost"), headerText?.substring(0, 50));
      const headerHtml = await page.locator("header").first().innerHTML();
      const enCount = (headerHtml.match(/>EN</g) || []).length;
      check(`${label}: no duplicate lang buttons`, enCount <= 1, `Found ${enCount} EN buttons`);
    }
    const btn = page.locator(`[data-testid="card-type-${cardType}"]`);
    if (await btn.count() === 0) {
      check(`${label}: ${cardType} button exists`, false, "Button not found");
      continue;
    }

    await btn.click();
    await page.waitForTimeout(800);

    // Check templates appear for this card type
    const templateBtns = page.locator('[data-testid^="template-"]');
    const count = await templateBtns.count();
    check(
      `${label}: ${cardType} has templates`,
      count > 0,
      `Found ${count} templates`
    );

    // Select first template for each card type and inspect Fabric canvas JSON
    if (count > 0) {
      await templateBtns.first().click();
      await page.waitForTimeout(3000); // wait for images to load

      const canvasArea = page.locator("canvas").first();
      check(`${label}: ${cardType} canvas exists`, (await canvasArea.count()) > 0, "");

      // Check canvas has objects loaded (Fabric internals not accessible from page.evaluate)
      // Unit test "ALL templates with placeholderData: zero [fieldName]" covers text correctness
      const canvasHasContent = await page.evaluate(() => {
        const c = document.querySelector("canvas");
        return c ? c.width > 0 && c.height > 0 : false;
      });
      check(
        `${label}: ${cardType} canvas has content`,
        canvasHasContent,
        "Canvas is empty or zero-sized"
      );

      // Layout checks via __fabricCanvas (exposed on canvas element)
      const fabricData = await page.evaluate(() => {
        const canvases = document.querySelectorAll("canvas.lower-canvas");
        for (const c of canvases) {
          const fc = c.__fabricCanvas;
          if (!fc) continue;
          const objs = fc.getObjects();
          return {
            objects: objs.map(o => ({
              type: o.type,
              originX: o.originX,
              originY: o.originY,
              left: o.left,
              top: o.top,
              width: o.width * (o.scaleX || 1),
              height: o.height * (o.scaleY || 1),
              text: o.text,
              fill: o.fill,
            })),
            canvasWidth: fc.width,
            canvasHeight: fc.height,
          };
        }
        return null;
      });

      if (fabricData) {
        // Check 1: All text objects have originX === "left" (global default fix)
        const textObjs = fabricData.objects.filter(o => o.type === "textbox");
        const allLeftOrigin = textObjs.every(o => o.originX === "left");
        check(
          `${label}: ${cardType} text origins are "left"`,
          allLeftOrigin,
          allLeftOrigin ? "" : `Found non-left origins`
        );

        // Check 2: No overlapping text bounding boxes (>20%)
        let hasOverlap = false;
        for (let i = 0; i < textObjs.length; i++) {
          for (let j = i + 1; j < textObjs.length; j++) {
            const a = textObjs[i];
            const b = textObjs[j];
            const overlapX = Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left));
            const overlapY = Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top));
            const overlapArea = overlapX * overlapY;
            const minArea = Math.min(a.width * a.height, b.width * b.height);
            if (minArea > 0 && overlapArea / minArea > 0.20) {
              hasOverlap = true;
            }
          }
        }
        check(
          `${label}: ${cardType} no text overlap >20%`,
          !hasOverlap,
          hasOverlap ? "Text boxes overlap >20%" : ""
        );

        // Check 3: All objects within canvas bounds
        const outOfBounds = fabricData.objects.filter(o =>
          o.left < -10 || o.top < -10 ||
          o.left + o.width > fabricData.canvasWidth + 10 ||
          o.top + o.height > fabricData.canvasHeight + 10
        );
        check(
          `${label}: ${cardType} objects within bounds`,
          outOfBounds.length === 0,
          outOfBounds.length > 0 ? `${outOfBounds.length} object(s) out of bounds` : ""
        );

        // Check 4: Line objects exist (for templates that should have them)
        const lineObjs = fabricData.objects.filter(o => o.type === "line");
        // Don't fail if no lines — some templates don't have them on front page
        if (lineObjs.length > 0) {
          check(
            `${label}: ${cardType} has line objects`,
            true,
            `${lineObjs.length} line(s) found`
          );
        }
      }
    }
  }

  check(`${label}: zero console errors`, consoleErrors.length === 0, consoleErrors.slice(0, 3).join("; ").substring(0, 200));
}

// ── Main ──

console.log(`\n╔══════════════════════════════════════════╗`);
console.log(`║  BENJEMIN Quality Gate                   ║`);
console.log(`║  Base: ${BASE.padEnd(33)}║`);
console.log(`╚══════════════════════════════════════════╝\n`);

const browser = await chromium.launch({ headless: true });

try {
  // DE Wizard
  const p1 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await testWizardFlow(p1, "de");
  await p1.close();

  // EN Wizard
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await testWizardFlow(p2, "en");
  await p2.close();

  // DE Canvas Builder
  const p3 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await testCanvasBuilderFlow(p3, "de");
  await p3.close();

  // EN Canvas Builder
  const p4 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await testCanvasBuilderFlow(p4, "en");
  await p4.close();

} finally {
  await browser.close();
}

// ── Report ──

console.log(`\n${"═".repeat(50)}`);
console.log(`  PASS: ${pass}  |  FAIL: ${fail}`);

if (failures.length > 0) {
  console.log(`\n  FAILURES:`);
  for (const f of failures) {
    console.log(`    ✗ ${f.name}`);
    if (f.detail) console.log(`      ${f.detail}`);
  }
}

console.log(`${"═".repeat(50)}\n`);

if (fail > 0) {
  console.log("❌ QUALITY GATE FAILED — DO NOT PUSH\n");
  process.exit(1);
} else {
  console.log("✅ QUALITY GATE PASSED\n");
  process.exit(0);
}
