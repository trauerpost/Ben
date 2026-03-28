/**
 * V2 Template Scorer — checks generated HTML against template config.
 * 100 points per template, pass ≥ 90.
 */
import "dotenv/config";
import { writeFileSync } from "fs";
import { renderSpreadHTML } from "../src/lib/editor/card-to-html-v2";
import { generateCardPDF } from "../src/lib/editor/pdf-generator";
import { getTemplateConfig } from "../src/lib/editor/template-configs";
import type { TemplateConfig, TemplateElement } from "../src/lib/editor/template-configs";
import { DEFAULT_TEXT_CONTENT } from "../src/lib/editor/wizard-state";
import type { WizardState } from "../src/lib/editor/wizard-state";

// ── Test Data ──

const TEST_DATA: Record<string, WizardState> = {
  TI04: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "TI04",
    photo: { url: null, originalUrl: null, sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: { ...DEFAULT_TEXT_CONTENT, heading: "In Gedenken an unsere", relationshipLabels: "Mutter, Oma, Schwiegermutter\nund Ehefrau", name: "Sieglinde Musterfrau", nameFontSize: 20, quote: "Ich glaube,\ndaß wenn der Tod\nunsere Augen schließt,\nwir in einem Licht stehn,\nvon welchem\nunser Sonnenlicht\nnur der Schatten ist.", quoteAuthor: "(Arthur Schopenhauer)", birthDate: "24. Juli 1952 –", deathDate: "28. September 2020", fontFamily: "Libre Baskerville", textAlign: "left" },
    decoration: { assetUrl: null, assetId: null }, border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
  TI05: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "TI05",
    photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", originalUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: { ...DEFAULT_TEXT_CONTENT, heading: "In liebevoller Erinnerung", name: "Brigitte Musterfrau", nameFontSize: 18, birthDate: "* 31. Juli 1950", deathDate: "† 20. Februar 2021", quote: "Das schönste Denkmal,\ndas ein Mensch bekommen kann,\nsteht in den Herzen\nder Mitmenschen.", quoteAuthor: "(Albert Schweitzer)", fontFamily: "Playfair Display" },
    decoration: { assetUrl: null, assetId: null }, border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
  TI06: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "TI06",
    photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", originalUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: { ...DEFAULT_TEXT_CONTENT, name: "Thilde Muster", nameFontSize: 16, birthDate: "* 4.6.1942", deathDate: "† 6.1.2021", quote: "Man sieht die Sonne\nlangsam untergehen\nund erschrickt dennoch,\ndass es plötzlich dunkel ist.", fontFamily: "EB Garamond" },
    decoration: { assetUrl: null, assetId: null }, border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
  TI07: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "TI07",
    photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", originalUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: { ...DEFAULT_TEXT_CONTENT, name: "Franziska\nMuster", nameFontSize: 18, birthDate: "* 1.12.1954", locationBirth: "in Starnberg", deathDate: "† 23.1.2021", locationDeath: "in Augsburg", dividerSymbol: "★ ★ ★", fontFamily: "Playfair Display" },
    decoration: { assetUrl: null, assetId: null }, border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
  TI08: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "TI08",
    photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", originalUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: { ...DEFAULT_TEXT_CONTENT, name: "Erna\nMusterfrau", nameFontSize: 20, birthDate: "* 1.12.1934", locationBirth: "in Starnberg", deathDate: "† 20. 1. 2021", locationDeath: "in Augsburg", fontFamily: "Cormorant Garamond" },
    decoration: { assetUrl: null, assetId: null }, border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
  TI09: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "TI09",
    photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80", originalUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80", sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: { ...DEFAULT_TEXT_CONTENT, heading: "Zum stillen Gedenken an", name: "Renate Musterfrau", nameFontSize: 18, birthDate: "* 6.5.1933", deathDate: "† 3.2.2021", dividerSymbol: "— — —", closingVerse: "O Herr,\ngib ihr die ewige Ruhe!", quote: "Du siehst den Garten\nnicht mehr grünen,\nin dem du einst\nso froh geschafft.\nSiehst deine Blumen\nnicht mehr blühen,\nweil dir der Tod\nnahm deine Kraft.\nWas wir an dir\nverloren haben,\ndas wissen wir\nnur ganz allein.", fontFamily: "Playfair Display" },
    decoration: { assetUrl: null, assetId: null }, border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
};

// ── Scoring Functions ──

interface Score { name: string; max: number; score: number; detail: string; }

function checkLayout(config: TemplateConfig, html: string): Score {
  let s = 0;
  const d: string[] = [];

  // Check spread dimensions in HTML
  if (html.includes(`width:${config.spreadWidthMm}mm`) && html.includes(`height:${config.spreadHeightMm}mm`)) {
    s += 10; d.push("spread dimensions ✓");
  } else { d.push("spread dimensions MISSING ✗"); }

  // Check position:relative container
  if (html.includes("position:relative")) { s += 5; d.push("relative container ✓"); }
  else { d.push("no relative container ✗"); }

  // Check all elements have position:absolute
  const absCount = (html.match(/position:absolute/g) || []).length;
  const expectedCount = config.elements.length;
  if (absCount >= expectedCount) { s += 5; d.push(`${absCount}/${expectedCount} absolute elements ✓`); }
  else { d.push(`${absCount}/${expectedCount} absolute elements ✗`); }

  return { name: "Layout", max: 20, score: s, detail: d.join("; ") };
}

function checkPhoto(config: TemplateConfig, state: WizardState, html: string): Score {
  const photoEls = config.elements.filter(e => e.type === "image");
  if (photoEls.length === 0) {
    if (!config.requiresPhoto) return { name: "Photo", max: 15, score: 15, detail: "No photo needed ✓" };
    return { name: "Photo", max: 15, score: 0, detail: "Photo required but no slot ✗" };
  }
  if (!state.photo.url) return { name: "Photo", max: 15, score: 0, detail: "Photo slot exists but no URL ✗" };

  let s = 0; const d: string[] = [];
  if (html.includes("background-size:cover")) { s += 8; d.push("cover ✓"); }
  // Check clip-path for ellipse
  const needsEllipse = photoEls.some(e => e.imageClip === "ellipse");
  if (needsEllipse) {
    if (html.includes("clip-path:ellipse")) { s += 4; d.push("ellipse clip ✓"); }
    else { d.push("ellipse clip MISSING ✗"); }
  } else { s += 4; d.push("no clip needed ✓"); }
  // Check rounded
  const needsRounded = photoEls.some(e => e.imageClip === "rounded");
  if (needsRounded) {
    if (html.includes("border-radius:8px")) { s += 3; d.push("rounded ✓"); }
    else { d.push("rounded MISSING ✗"); }
  } else { s += 3; d.push("no rounding needed ✓"); }

  return { name: "Photo", max: 15, score: Math.min(s, 15), detail: d.join("; ") };
}

function checkTextContent(config: TemplateConfig, state: WizardState, html: string): Score {
  const textEls = config.elements.filter(e => e.type === "text" && e.field);
  let found = 0; let total = 0; const d: string[] = [];

  for (const el of textEls) {
    const val = getVal(state.textContent, el.field!);
    if (!val) continue;
    total++;
    const firstLine = val.split("\n")[0];
    if (html.includes(firstLine)) { found++; d.push(`${el.field} ✓`); }
    else { d.push(`${el.field} ✗`); }
  }
  const pts = total > 0 ? Math.round(found / total * 15) : 15;
  return { name: "Text Content", max: 15, score: pts, detail: d.join("; ") };
}

function checkFontHierarchy(config: TemplateConfig, html: string): Score {
  let s = 0; const d: string[] = [];
  // Check bold exists for name
  const nameEl = config.elements.find(e => e.field === "name");
  if (nameEl?.fontWeight === "bold" || nameEl?.fontWeight === "300") {
    if (html.includes(`font-weight:${nameEl.fontWeight}`)) { s += 8; d.push(`name weight ${nameEl.fontWeight} ✓`); }
    else { d.push(`name weight ${nameEl.fontWeight} ✗`); }
  } else { s += 8; d.push("name default weight ✓"); }

  // Check name fontSize is largest
  const sizes = config.elements.filter(e => e.type === "text" && e.fontSize).map(e => e.fontSize!);
  const nameSize = nameEl?.fontSize ?? 0;
  if (nameSize >= Math.max(...sizes.filter(s => s !== nameSize), 0)) { s += 7; d.push("name is largest font ✓"); }
  else { d.push("name is NOT largest ✗"); }

  return { name: "Font Hierarchy", max: 15, score: s, detail: d.join("; ") };
}

function checkSpacing(html: string): Score {
  let s = 0; const d: string[] = [];
  if (html.includes("overflow:hidden")) { s += 5; d.push("overflow hidden ✓"); }
  else { d.push("no overflow hidden ✗"); }
  if (html.includes("line-height:1.5")) { s += 5; d.push("line-height ✓"); }
  else { s += 3; d.push("line-height not 1.5"); }
  return { name: "Spacing", max: 10, score: s, detail: d.join("; ") };
}

function checkDecorations(config: TemplateConfig, html: string): Score {
  const ornaments = config.elements.filter(e => e.type === "ornament");
  const lines = config.elements.filter(e => e.type === "line");

  if (ornaments.length === 0 && lines.length === 0) {
    return { name: "Decorations", max: 10, score: 10, detail: "None expected ✓" };
  }

  let s = 0; const d: string[] = [];

  for (const orn of ornaments) {
    if (html.includes("object-fit:contain") || html.includes("object-fit: contain")) {
      s += 5; d.push(`ornament ${orn.id} ✓`);
    } else { d.push(`ornament ${orn.id} ✗`); }
  }

  for (const line of lines) {
    if (html.includes(`border-top:${line.lineStyle}`)) {
      s += 3; d.push(`line ${line.id} ✓`);
    } else { d.push(`line ${line.id} ✗`); }
  }

  return { name: "Decorations", max: 10, score: Math.min(s, 10), detail: d.join("; ") };
}

function checkTypography(config: TemplateConfig, html: string): Score {
  let s = 0; const d: string[] = [];

  // Check italic
  const needsItalic = config.elements.some(e => e.fontStyle === "italic");
  if (needsItalic) {
    if (html.includes("font-style:italic")) { s += 3; d.push("italic ✓"); }
    else { d.push("italic ✗"); }
  } else { s += 3; d.push("no italic needed ✓"); }

  // Check small-caps
  const needsSC = config.elements.some(e => e.fontVariant === "small-caps");
  if (needsSC) {
    if (html.includes("font-variant:small-caps")) { s += 3; d.push("small-caps ✓"); }
    else { d.push("small-caps ✗"); }
  } else { s += 3; d.push("no small-caps needed ✓"); }

  // Check serif
  if (html.includes("serif")) { s += 2; d.push("serif ✓"); }
  else { d.push("no serif ✗"); }

  // Check pt units
  if (html.includes("pt;") || html.includes("pt\"")) { s += 2; d.push("pt units ✓"); }
  else { d.push("no pt units ✗"); }

  return { name: "Typography", max: 10, score: s, detail: d.join("; ") };
}

function checkBackground(html: string): Score {
  if (html.includes("background:white") || html.includes("background: white")) {
    return { name: "Background", max: 5, score: 5, detail: "white ✓" };
  }
  return { name: "Background", max: 5, score: 3, detail: "not explicitly white" };
}

function getVal(tc: any, field: string): string {
  const v = tc[field]; return typeof v === "string" ? v : "";
}

// ── Main ──

async function scoreOne(id: string): Promise<void> {
  const state = TEST_DATA[id];
  const config = getTemplateConfig(id);
  if (!state || !config) { console.error(`No data for ${id}`); return; }

  console.log(`\n=== ${id}: ${config.name} ===`);

  const html = await renderSpreadHTML(state);

  const scores: Score[] = [
    checkLayout(config, html),
    checkPhoto(config, state, html),
    checkTextContent(config, state, html),
    checkFontHierarchy(config, html),
    checkSpacing(html),
    checkDecorations(config, html),
    checkTypography(config, html),
    checkBackground(html),
  ];

  const total = scores.reduce((s, c) => s + c.score, 0);
  const max = scores.reduce((s, c) => s + c.max, 0);
  const pass = total >= 90;

  for (const sc of scores) {
    const bar = `${sc.score}/${sc.max}`.padStart(6);
    const dots = ".".repeat(Math.max(2, 22 - sc.name.length));
    console.log(`  ${sc.name} ${dots} ${bar}  ${sc.detail}`);
  }
  console.log(`\n  TOTAL: ${total}/${max}  ${pass ? "PASS ✓" : "FAIL ✗"}`);

  // Also generate PDF for visual check
  const pdf = await generateCardPDF(state);
  const path = `C:/Users/fires/OneDrive/Git/BENJEMIN/public/test-pdfs/${id}.pdf`;
  writeFileSync(path, pdf);
  console.log(`  PDF: ${pdf.length} bytes → ${path}`);
}

async function main(): Promise<void> {
  const ids = process.argv[2] === "--all"
    ? Object.keys(TEST_DATA)
    : process.argv.slice(2).filter(id => TEST_DATA[id]);

  if (ids.length === 0) {
    console.log("Usage: npx tsx scripts/score-v2.ts TI04");
    console.log("       npx tsx scripts/score-v2.ts --all");
    return;
  }

  for (const id of ids) {
    await scoreOne(id);
  }

  console.log("\n=== SUMMARY ===");
  console.log("Run --all to score all templates.");
}

main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
