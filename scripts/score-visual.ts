// @ts-nocheck
/**
 * Visual Template Scorer — uses Puppeteer to render templates and verify visually.
 * 100 points per template, pass >= 80.
 *
 * Usage:
 *   npx tsx scripts/score-visual.ts --all
 *   npx tsx scripts/score-visual.ts TI04
 *   npx tsx scripts/score-visual.ts --negative
 */
import "dotenv/config";
import puppeteer from "puppeteer";
import type { Browser, Page } from "puppeteer";
import { renderSpreadHTML } from "../src/lib/editor/card-to-html-v2";
import { getTemplateConfig } from "../src/lib/editor/template-configs";
import type { TemplateConfig } from "../src/lib/editor/template-configs";
import { DEFAULT_TEXT_CONTENT } from "../src/lib/editor/wizard-state";
import type { WizardState } from "../src/lib/editor/wizard-state";

// ── Constants ──

// 140mm x 105mm at 96dpi: 1mm = 96/25.4 px
const MM_TO_PX = 96 / 25.4;
const VIEWPORT_W = Math.round(140 * MM_TO_PX); // ~529
const VIEWPORT_H = Math.round(105 * MM_TO_PX); // ~397

// ── Test Data (copied from score-v2.ts) ──

const TEST_DATA: Record<string, WizardState> = {
  TI04: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "TI04",
    photo: { url: null, originalUrl: null, sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: { ...DEFAULT_TEXT_CONTENT, heading: "In Gedenken an unsere", relationshipLabels: "Mutter, Oma, Schwiegermutter\nund Ehefrau", name: "Sieglinde Musterfrau", nameFontSize: 20, quote: "Ich glaube,\ndaß wenn der Tod\nunsere Augen schließt,\nwir in einem Licht stehn,\nvon welchem\nunser Sonnenlicht\nnur der Schatten ist.", quoteAuthor: "(Arthur Schopenhauer)", birthDate: "24. Juli 1952 \u2013", deathDate: "28. September 2020", fontFamily: "Libre Baskerville", textAlign: "left" },
    decoration: { assetUrl: null, assetId: null }, border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
  TI05: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "TI05",
    photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", originalUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: { ...DEFAULT_TEXT_CONTENT, heading: "In liebevoller Erinnerung", name: "Brigitte Musterfrau", nameFontSize: 18, birthDate: "* 31. Juli 1950", deathDate: "\u2020 20. Februar 2021", quote: "Das sch\u00f6nste Denkmal,\ndas ein Mensch bekommen kann,\nsteht in den Herzen\nder Mitmenschen.", quoteAuthor: "(Albert Schweitzer)", fontFamily: "Playfair Display" },
    decoration: { assetUrl: null, assetId: null }, border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
  TI06: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "TI06",
    photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", originalUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: { ...DEFAULT_TEXT_CONTENT, name: "Thilde Muster", nameFontSize: 16, birthDate: "* 4.6.1942", deathDate: "\u2020 6.1.2021", quote: "Man sieht die Sonne\nlangsam untergehen\nund erschrickt dennoch,\ndass es pl\u00f6tzlich dunkel ist.", fontFamily: "EB Garamond" },
    decoration: { assetUrl: null, assetId: null }, border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
  TI07: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "TI07",
    photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", originalUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: { ...DEFAULT_TEXT_CONTENT, name: "Franziska\nMuster", nameFontSize: 18, birthDate: "* 1.12.1954", locationBirth: "in Starnberg", deathDate: "\u2020 23.1.2021", locationDeath: "in Augsburg", dividerSymbol: "\u2605 \u2605 \u2605", fontFamily: "Playfair Display" },
    decoration: { assetUrl: null, assetId: null }, border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
  TI08: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "TI08",
    photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", originalUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: { ...DEFAULT_TEXT_CONTENT, name: "Erna\nMusterfrau", nameFontSize: 20, birthDate: "* 1.12.1934", locationBirth: "in Starnberg", deathDate: "\u2020 20. 1. 2021", locationDeath: "in Augsburg", fontFamily: "Cormorant Garamond" },
    decoration: { assetUrl: null, assetId: null }, border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
  TI09: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "TI09",
    photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80", originalUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80", sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: { ...DEFAULT_TEXT_CONTENT, heading: "Zum stillen Gedenken an", name: "Renate Musterfrau", nameFontSize: 18, birthDate: "* 6.5.1933", deathDate: "\u2020 3.2.2021", dividerSymbol: "\u2014 \u2014 \u2014", closingVerse: "O Herr,\ngib ihr die ewige Ruhe!", quote: "Du siehst den Garten\nnicht mehr gr\u00fcnen,\nin dem du einst\nso froh geschafft.\nSiehst deine Blumen\nnicht mehr bl\u00fchen,\nweil dir der Tod\nnahm deine Kraft.\nWas wir an dir\nverloren haben,\ndas wissen wir\nnur ganz allein.", fontFamily: "Playfair Display" },
    decoration: { assetUrl: null, assetId: null }, border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
};

// ── Negative Test Cases ──

function getNegativeTests(): Record<string, { state: WizardState; htmlTransform?: (html: string) => string; description: string; expectBelow: number }> {
  // NEG1: Missing photo + cleared text — TI05 requires photo, remove it and blank out text
  // Loses: photo 20pts + text 30pts = 50pts lost => score ~50. Also inject wrong bg via HTML.
  const neg1State: WizardState = JSON.parse(JSON.stringify(TEST_DATA.TI05));
  neg1State.photo.url = null;
  neg1State.textContent.heading = "";
  neg1State.textContent.name = "";
  neg1State.textContent.quote = "";
  neg1State.textContent.quoteAuthor = "";
  neg1State.textContent.birthDate = "";
  neg1State.textContent.deathDate = "";

  // NEG2: Wrong background + cleared text — inject gray bg, blank text, wrong dimensions
  // Loses: bg 10pts + text 30pts + dimensions via HTML transform
  const neg2State: WizardState = JSON.parse(JSON.stringify(TEST_DATA.TI05));
  neg2State.photo.url = null;
  neg2State.textContent.heading = "";
  neg2State.textContent.name = "";
  neg2State.textContent.quote = "";
  neg2State.textContent.quoteAuthor = "";
  neg2State.textContent.birthDate = "";
  neg2State.textContent.deathDate = "";

  return {
    NEG_MISSING_PHOTO: {
      state: neg1State,
      htmlTransform: (html: string) => html.replace(/background:white/g, "background:#808080"),
      description: "TI05 with no photo + empty text + gray bg (loses photo 20 + text 30 + bg 10 = 60)",
      expectBelow: 50,
    },
    NEG_WRONG_BACKGROUND: {
      state: neg2State,
      htmlTransform: (html: string) =>
        html.replace(/background:white/g, "background:#808080")
            .replace(/width:140mm/, "width:100mm")
            .replace(/height:105mm/, "height:80mm"),
      description: "TI05 with gray bg + no photo + empty text + wrong dims (loses bg 10 + photo 20 + text 30 + dims 10 = 70)",
      expectBelow: 50,
    },
  };
}

// ── Scoring ──
// NOTE: All page.evaluate() calls use string expressions to avoid tsx __name decorator injection.

interface Score {
  name: string;
  max: number;
  score: number;
  detail: string;
}

async function checkBackground(page: Page): Promise<Score> {
  const corners = await page.evaluate(`
    (function() {
      var container = document.querySelector('body > div');
      if (!container) return { ok: false, detail: 'no container found' };
      var style = getComputedStyle(container);
      var bg = style.backgroundColor;
      var match = bg.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
      if (!match) return { ok: false, detail: 'unparseable bg: ' + bg };
      var r = parseInt(match[1]), g = parseInt(match[2]), b = parseInt(match[3]);
      var isWhite = r >= 250 && g >= 250 && b >= 250;
      return { ok: isWhite, detail: 'bg=' + bg + ' rgb(' + r + ',' + g + ',' + b + ')' };
    })()
  `);

  if (corners.ok) {
    return { name: "Background", max: 10, score: 10, detail: `white corners OK (${corners.detail})` };
  }
  return { name: "Background", max: 10, score: 0, detail: `non-white corners (${corners.detail})` };
}

async function checkPhotoPresence(page: Page, config: TemplateConfig, state: WizardState): Promise<Score> {
  const photoEls = config.elements.filter(e => e.type === "image");

  if (photoEls.length === 0) {
    if (!config.requiresPhoto) return { name: "Photo", max: 20, score: 20, detail: "No photo needed" };
    return { name: "Photo", max: 20, score: 0, detail: "Photo required but no slot in config" };
  }

  if (!state.photo.url) {
    return { name: "Photo", max: 20, score: 0, detail: "Photo required but url is null" };
  }

  const hasBgImage = await page.evaluate(`
    (function() {
      var allDivs = document.querySelectorAll("div[style*='background-image']");
      for (var i = 0; i < allDivs.length; i++) {
        var style = allDivs[i].style;
        if (style.backgroundImage && style.backgroundImage !== 'none') return true;
      }
      return false;
    })()
  `);

  if (hasBgImage) {
    return { name: "Photo", max: 20, score: 20, detail: "Photo element with background-image found" };
  }
  return { name: "Photo", max: 20, score: 0, detail: "No photo element with background-image found" };
}

async function checkTextFields(page: Page, config: TemplateConfig, state: WizardState): Promise<Score> {
  const textEls = config.elements.filter(e => e.type === "text" && e.field);
  const fieldsToCheck: { id: string; field: string; expectedText: string }[] = [];

  for (const el of textEls) {
    const val = getVal(state.textContent, el.field!);
    if (!val) continue;
    fieldsToCheck.push({ id: el.id, field: el.field!, expectedText: val.split("\n")[0] });
  }

  // If config defines text elements but none have content, that's a failure
  if (fieldsToCheck.length === 0) {
    if (textEls.length > 0) {
      return { name: "Text Fields", max: 30, score: 0, detail: `${textEls.length} text slots defined but all empty` };
    }
    return { name: "Text Fields", max: 30, score: 30, detail: "No text fields to check" };
  }

  const ptsPerField = Math.min(5, Math.floor(30 / fieldsToCheck.length));
  let total = 0;
  const details: string[] = [];

  for (const f of fieldsToCheck) {
    const escapedText = f.expectedText.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const found = await page.evaluate(`
      (function() {
        var el = document.getElementById('el-${f.id}');
        if (!el) return { exists: false, hasText: false };
        var content = el.textContent || '';
        return { exists: true, hasText: content.indexOf('${escapedText}') >= 0 };
      })()
    `);

    if (found.exists && found.hasText) {
      total += ptsPerField;
      details.push(`${f.field} OK`);
    } else if (found.exists) {
      total += Math.floor(ptsPerField / 2);
      details.push(`${f.field} el-exists-but-text-mismatch`);
    } else {
      details.push(`${f.field} MISSING`);
    }
  }

  return { name: "Text Fields", max: 30, score: Math.min(total, 30), detail: details.join("; ") };
}

async function checkNoOverlaps(page: Page, config: TemplateConfig): Promise<Score> {
  const ids = config.elements.map(e => e.id);
  const idsJson = JSON.stringify(ids);

  const rects = await page.evaluate(`
    (function() {
      var elementIds = ${idsJson};
      var result = [];
      for (var i = 0; i < elementIds.length; i++) {
        var el = document.getElementById('el-' + elementIds[i]);
        if (!el) continue;
        var r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          result.push({ id: elementIds[i], rect: { x: r.x, y: r.y, w: r.width, h: r.height } });
        }
      }
      var allAbsolute = document.querySelectorAll("div[style*='position:absolute']");
      for (var j = 0; j < allAbsolute.length; j++) {
        var htmlEl = allAbsolute[j];
        if (htmlEl.id && htmlEl.id.indexOf('el-') === 0) continue;
        var r2 = htmlEl.getBoundingClientRect();
        if (r2.width > 0 && r2.height > 0) {
          result.push({ id: 'anon-' + result.length, rect: { x: r2.x, y: r2.y, w: r2.width, h: r2.height } });
        }
      }
      return result;
    })()
  `);

  let overlapCount = 0;
  const overlapDetails: string[] = [];

  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i].rect;
      const b = rects[j].rect;

      const overlapX = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
      const overlapY = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      const overlapArea = overlapX * overlapY;

      const areaA = a.w * a.h;
      const areaB = b.w * b.h;
      const minArea = Math.min(areaA, areaB);

      if (minArea > 0 && overlapArea / minArea > 0.05) {
        overlapCount++;
        const pct = (overlapArea / minArea * 100).toFixed(1);
        overlapDetails.push(`${rects[i].id} x ${rects[j].id} (${pct}%)`);
      }
    }
  }

  if (overlapCount === 0) {
    return { name: "No Overlaps", max: 20, score: 20, detail: `${rects.length} elements, no significant overlaps` };
  }

  const deduction = Math.min(20, overlapCount * 5);
  return {
    name: "No Overlaps",
    max: 20,
    score: 20 - deduction,
    detail: `${overlapCount} overlaps: ${overlapDetails.slice(0, 3).join("; ")}${overlapCount > 3 ? "..." : ""}`,
  };
}

async function checkDimensions(page: Page): Promise<Score> {
  const dims = await page.evaluate(`
    (function() {
      var container = document.querySelector('body > div');
      if (!container) return { w: 0, h: 0 };
      var r = container.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    })()
  `);

  const wOk = Math.abs(dims.w - VIEWPORT_W) <= 5;
  const hOk = Math.abs(dims.h - VIEWPORT_H) <= 5;

  if (wOk && hOk) {
    return { name: "Dimensions", max: 10, score: 10, detail: `${dims.w}x${dims.h} (expected ~${VIEWPORT_W}x${VIEWPORT_H})` };
  }
  let s = 0;
  if (wOk) s += 5;
  if (hOk) s += 5;
  return { name: "Dimensions", max: 10, score: s, detail: `${dims.w}x${dims.h} vs expected ${VIEWPORT_W}x${VIEWPORT_H}` };
}

async function checkOrnaments(page: Page, config: TemplateConfig): Promise<Score> {
  const ornamentEls = config.elements.filter(e => e.type === "ornament");

  if (ornamentEls.length === 0) {
    return { name: "Ornaments", max: 10, score: 10, detail: "No ornaments expected" };
  }

  const imgCount = await page.evaluate(`
    (function() {
      var imgs = document.querySelectorAll('img[src]');
      var valid = 0;
      for (var i = 0; i < imgs.length; i++) {
        var src = imgs[i].src;
        if (src && src.length > 10) valid++;
      }
      return valid;
    })()
  `);

  let found: number;
  const details: string[] = [];

  if (imgCount >= ornamentEls.length) {
    found = ornamentEls.length;
    details.push(`${imgCount} img elements with valid src`);
  } else {
    found = imgCount;
    details.push(`${imgCount}/${ornamentEls.length} ornament imgs found`);
  }

  const pts = ornamentEls.length > 0 ? Math.round(found / ornamentEls.length * 10) : 10;
  return { name: "Ornaments", max: 10, score: pts, detail: details.join("; ") };
}

function getVal(tc: Record<string, unknown>, field: string): string {
  const v = tc[field];
  return typeof v === "string" ? v : "";
}

// ── Main scoring ──

async function scoreTemplate(
  browser: Browser,
  id: string,
  state: WizardState,
  config: TemplateConfig,
  htmlOverride?: string,
): Promise<{ total: number; max: number; pass: boolean }> {
  console.log(`\n=== ${id}: ${config.name} ===`);

  const html = htmlOverride ?? await renderSpreadHTML(state);

  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_W, height: VIEWPORT_H });
  await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 10000 });
  // Allow fonts/images to load
  await new Promise(r => setTimeout(r, 2000));

  // Auto-shrink text (inline string eval to avoid tsx __name issue)
  const textElements = config.elements.filter(el => el.type === "text" && el.autoShrink !== false);
  for (const el of textElements) {
    const minSize = el.minFontSize ?? 6;
    await page.evaluate(`
      (function() {
        var container = document.getElementById('el-${el.id}');
        if (!container) return;
        var textDiv = container.querySelector('div');
        if (!textDiv) return;
        var size = parseFloat(textDiv.style.fontSize);
        if (isNaN(size)) return;
        var iterations = 0;
        while (container.scrollHeight > container.clientHeight && size > ${minSize} && iterations < 50) {
          size -= 0.5;
          textDiv.style.fontSize = size + 'pt';
          iterations++;
        }
      })()
    `);
  }

  // Wait for fonts/images to settle
  await new Promise(r => setTimeout(r, 500));

  const scores: Score[] = [
    await checkBackground(page),
    await checkPhotoPresence(page, config, state),
    await checkTextFields(page, config, state),
    await checkNoOverlaps(page, config),
    await checkDimensions(page),
    await checkOrnaments(page, config),
  ];

  await page.close();

  const total = scores.reduce((s, c) => s + c.score, 0);
  const max = scores.reduce((s, c) => s + c.max, 0);
  const pass = total >= 80;

  for (const sc of scores) {
    const bar = `${sc.score}/${sc.max}`.padStart(6);
    const dots = ".".repeat(Math.max(2, 22 - sc.name.length));
    console.log(`  ${sc.name} ${dots} ${bar}  ${sc.detail}`);
  }
  console.log(`\n  TOTAL: ${total}/${max}  ${pass ? "PASS" : "FAIL"}`);

  return { total, max, pass };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: npx tsx scripts/score-visual.ts --all");
    console.log("       npx tsx scripts/score-visual.ts TI04");
    console.log("       npx tsx scripts/score-visual.ts --negative");
    return;
  }

  const browser = await puppeteer.launch({ headless: true });

  try {
    if (args[0] === "--negative") {
      const negTests = getNegativeTests();
      const results = new Map<string, { total: number; pass: boolean }>();

      for (const [name, test] of Object.entries(negTests)) {
        const templateId = test.state.templateId!;
        const config = getTemplateConfig(templateId);
        if (!config) { console.error(`No config for ${templateId}`); continue; }

        console.log(`\n--- NEGATIVE: ${name} ---`);
        console.log(`  ${test.description}`);
        console.log(`  Expected score < ${test.expectBelow}`);

        let htmlOverride: string | undefined;
        if (test.htmlTransform) {
          const html = await renderSpreadHTML(test.state);
          htmlOverride = test.htmlTransform(html);
        }

        const r = await scoreTemplate(browser, `${name} (${templateId})`, test.state, config, htmlOverride);
        const negPass = r.total < test.expectBelow;

        console.log(`  NEGATIVE CHECK: score=${r.total} < ${test.expectBelow}? ${negPass ? "PASS (correctly low)" : "FAIL (score too high)"}`);
        results.set(name, { total: r.total, pass: negPass });
      }

      console.log("\n=== NEGATIVE SUMMARY ===");
      let allNegPass = true;
      for (const [name, r] of results) {
        const status = r.pass ? "PASS" : "FAIL";
        console.log(`  ${name}: score=${r.total} ${status}`);
        if (!r.pass) allNegPass = false;
      }
      if (!allNegPass) process.exitCode = 1;
      return;
    }

    const ids = args[0] === "--all"
      ? Object.keys(TEST_DATA)
      : args.filter(id => TEST_DATA[id]);

    if (ids.length === 0) {
      console.log("No matching template IDs found.");
      return;
    }

    const results = new Map<string, { total: number; pass: boolean }>();

    for (const id of ids) {
      const state = TEST_DATA[id];
      const config = getTemplateConfig(id);
      if (!config) { console.error(`No config for ${id}`); continue; }
      const r = await scoreTemplate(browser, id, state, config);
      results.set(id, { total: r.total, pass: r.pass });
    }

    console.log("\n=== SUMMARY ===");
    let allPass = true;
    for (const [id, r] of results) {
      const status = r.pass ? "PASS" : "FAIL";
      console.log(`  ${id}: TOTAL: ${r.total}/100 ${status}`);
      if (!r.pass) allPass = false;
    }
    if (!allPass) process.exitCode = 1;

  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
