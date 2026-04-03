#!/usr/bin/env node
/**
 * Audit: Screenshot every template's preview on production.
 * Shows what the USER actually sees — Rule 3: Screenshot = Truth.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "https://trauerpost.vercel.app";
const TEMPLATES = ["TI05", "TI06", "TI07", "TI08", "TI09"];
const SCREENSHOTS_DIR = "e2e/screenshots/audit";

const browser = await chromium.launch({ headless: true });

for (const tid of TEMPLATES) {
  console.log(`\n── ${tid} ──`);
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    await page.goto(`${BASE}/de/builder-v2?_t=${Date.now()}`, { waitUntil: "networkidle", timeout: 30000 });

    // Select sterbebild → template
    await page.locator('[data-testid="card-type-sterbebild"]').click({ timeout: 15000 });
    await page.locator(`[data-testid="template-${tid}"]`).click({ timeout: 10000 });
    await page.locator('button:text-is("Elemente"), button:text-is("Elements")').waitFor({ timeout: 20000 });
    await page.waitForTimeout(3000);

    // Screenshot canvas (before preview)
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/${tid}-canvas.png` });
    console.log(`  Canvas: saved`);

    // Click preview
    const previewBtn = page.locator('button:has-text("Vorschau"), button:has-text("Preview")');
    await previewBtn.first().click({ timeout: 5000 });
    await page.waitForTimeout(5000);

    // Screenshot preview modal
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/${tid}-preview.png` });
    console.log(`  Preview: saved`);

    // Measure outer iframe
    const outerIframe = page.locator("iframe").first();
    const box = await outerIframe.boundingBox();
    if (box) {
      console.log(`  Iframe: ${box.width.toFixed(0)}x${box.height.toFixed(0)}`);

      const scroll = await outerIframe.evaluate((el) => {
        const doc = el.contentDocument;
        if (!doc) return null;
        const b = doc.documentElement;
        return {
          scrollW: b.scrollWidth, clientW: b.clientWidth,
          scrollH: b.scrollHeight, clientH: b.clientHeight,
        };
      }).catch(() => null);

      if (scroll) {
        const hScroll = scroll.scrollW > scroll.clientW + 2;
        const vScroll = scroll.scrollH > scroll.clientH + 2;
        console.log(`  Scrollbars: H=${hScroll} V=${vScroll} (scroll=${scroll.scrollW}x${scroll.scrollH} client=${scroll.clientW}x${scroll.clientH})`);
      }
    } else {
      console.log(`  Iframe: NOT FOUND`);
    }
  } catch (err) {
    console.log(`  ERROR: ${err.message?.substring(0, 100)}`);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/${tid}-error.png` });
  }

  await page.close();
}

await browser.close();
console.log(`\nDone. Screenshots in ${SCREENSHOTS_DIR}/`);
