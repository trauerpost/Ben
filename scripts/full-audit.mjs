import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const BASE = process.env.BASE_URL || "http://localhost:3000";
const bugs = [];

function bug(severity, area, description, evidence) {
  bugs.push({ severity, area, description, evidence });
  console.log(`  [${severity}] ${area}: ${description}`);
  if (evidence) console.log(`    > ${evidence}`);
}

// 1. HOMEPAGE
console.log("\n=== 1. HOMEPAGE ===");
for (const locale of ["de", "en"]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`${BASE}/${locale}`, { waitUntil: "networkidle", timeout: 15000 });
  await page.screenshot({ path: `test-results/audit-home-${locale}.png` });
  const headerText = await page.locator("header").first().textContent();
  if (locale === "en" && headerText?.includes("Funeral mail")) {
    bug("HIGH", `${locale} home`, "Site name 'Funeral mail' instead of 'Trauerpost'");
  }
  const headerHtml = await page.locator("header").first().innerHTML();
  if ((headerHtml.match(/>EN</g) || []).length > 1) bug("MEDIUM", `${locale} home`, "Duplicate EN buttons");
  if ((headerHtml.match(/>DE</g) || []).length > 1) bug("MEDIUM", `${locale} home`, "Duplicate DE buttons");
  if (errors.length > 0) bug("HIGH", `${locale} home`, `${errors.length} console errors`, errors[0]?.substring(0, 100));
  await page.close();
}

// 2. WIZARD — ALL CARD TYPES × ALL LOCALES
console.log("\n=== 2. WIZARD ===");
const cardTypes = [
  { id: "sterbebild", de: "Erinnerungsbild", en: "Memorial Card" },
  { id: "trauerkarte", de: "Trauerkarte", en: "Mourning Card" },
  { id: "dankkarte", de: "Dankeskarte", en: "Thank-you Card" },
];

for (const locale of ["de", "en"]) {
  for (const ct of cardTypes) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`${BASE}/${locale}/builder`, { waitUntil: "networkidle", timeout: 15000 });
    const btnText = locale === "de" ? ct.de : ct.en;
    const cardBtn = page.locator(`button:has-text("${btnText}")`);
    if (await cardBtn.count() === 0) { bug("CRITICAL", `${locale} wizard`, `Button "${btnText}" not found`); await page.close(); continue; }
    await cardBtn.click();
    await page.waitForTimeout(500);

    if (ct.id !== "sterbebild") {
      const singleBtn = page.locator("button:has-text('Einfach'), button:has-text('Simple')");
      if (await singleBtn.count() > 0) { await singleBtn.first().click(); await page.waitForTimeout(300); }
    }

    const nextBtn = page.locator("button:has-text('Next')");
    const disabled = await nextBtn.getAttribute("aria-disabled");
    if (disabled === "true") { bug("CRITICAL", `${locale} wizard ${ct.id}`, "Next disabled after card type"); await page.close(); continue; }
    await nextBtn.click();
    await page.waitForTimeout(800);

    const tplBtns = page.locator("button[data-testid]");
    const tplCount = await tplBtns.count();
    if (tplCount === 0) {
      bug("CRITICAL", `${locale} wizard ${ct.id}`, "ZERO templates shown");
    } else {
      console.log(`  OK ${locale} wizard ${ct.id}: ${tplCount} templates`);
      await tplBtns.first().click();
      await page.waitForTimeout(300);
      // Navigate through steps
      for (let i = 0; i < 4; i++) {
        const nb = page.locator("button:has-text('Next')");
        if (await nb.count() > 0 && await nb.getAttribute("aria-disabled") !== "true") {
          await nb.click(); await page.waitForTimeout(400);
        }
      }
      await page.screenshot({ path: `test-results/audit-wizard-${locale}-${ct.id}.png` });
      const body = await page.textContent("body");
      if (/\[(heading|name|birthDate|deathDate|quote|quoteAuthor)\]/.test(body || "")) {
        bug("CRITICAL", `${locale} wizard ${ct.id}`, "Raw [fieldName] visible");
      }
    }
    if (errors.length > 0) bug("HIGH", `${locale} wizard ${ct.id}`, `${errors.length} console errors`, errors[0]?.substring(0, 100));
    await page.close();
  }
}

// 3. CANVAS BUILDER — ALL CARD TYPES × ALL LOCALES
console.log("\n=== 3. CANVAS BUILDER ===");
for (const locale of ["de", "en"]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`${BASE}/${locale}/builder-v2`, { waitUntil: "networkidle", timeout: 15000 });
  await page.screenshot({ path: `test-results/audit-canvas-${locale}-init.png` });

  for (const ct of ["sterbebild", "trauerkarte", "dankkarte"]) {
    const btn = page.locator(`[data-testid="card-type-${ct}"]`);
    if (await btn.count() === 0) { bug("CRITICAL", `${locale} canvas`, `Card type "${ct}" button MISSING`); continue; }
    await btn.click();
    await page.waitForTimeout(800);
    const tplBtns = page.locator('[data-testid^="template-"]');
    const tplCount = await tplBtns.count();
    if (tplCount === 0) {
      bug("CRITICAL", `${locale} canvas ${ct}`, "ZERO templates after selecting card type");
    } else {
      console.log(`  OK ${locale} canvas ${ct}: ${tplCount} templates`);
      // Check thumbnails
      const imgs = tplBtns.first().locator("img");
      if (await imgs.count() === 0) bug("HIGH", `${locale} canvas ${ct}`, "Template has no thumbnail image");
    }
  }

  // Deep check: select TI05 and inspect canvas
  const sterbe = page.locator('[data-testid="card-type-sterbebild"]');
  if (await sterbe.count() > 0) {
    await sterbe.click(); await page.waitForTimeout(500);
    for (const tplId of ["TI04", "TI05", "TI08"]) {
      const tpl = page.locator(`[data-testid="template-${tplId}"]`);
      if (await tpl.count() > 0) {
        await tpl.click(); await page.waitForTimeout(2000);
        await page.screenshot({ path: `test-results/audit-canvas-${locale}-${tplId}.png` });
        const body = await page.textContent("body");
        if (/\[(heading|name|birthDate|deathDate|quote|quoteAuthor|relationshipLabels|closingVerse)\]/.test(body || "")) {
          bug("CRITICAL", `${locale} canvas ${tplId}`, "Raw [fieldName] on canvas");
        }
        if (!body?.includes("Muster") && !body?.includes("muster")) {
          bug("HIGH", `${locale} canvas ${tplId}`, "No placeholder text — may show empty or field names");
        }
      }
    }
  }

  if (errors.length > 0) bug("HIGH", `${locale} canvas`, `${errors.length} console errors`, errors.slice(0, 2).join("; ").substring(0, 200));
  await page.close();
}

// 4. MOBILE
console.log("\n=== 4. MOBILE ===");
for (const path of ["/de", "/de/builder", "/de/builder-v2", "/en/builder"]) {
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 15000 });
  await page.screenshot({ path: `test-results/audit-mobile${path.replace(/\//g, "-")}.png` });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) bug("MEDIUM", `mobile ${path}`, "Horizontal scroll — content overflows viewport");
  await page.close();
}

// 5. OTHER PAGES
console.log("\n=== 5. OTHER PAGES ===");
for (const path of ["/de/templates", "/de/products", "/de/pricing", "/de/about", "/en/templates", "/en/pricing", "/en/about"]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  const resp = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 15000 }).catch(() => null);
  if (!resp?.ok()) bug("HIGH", path, `HTTP ${resp?.status() || "error"}`);
  else console.log(`  OK ${path}: ${resp?.status()}`);
  if (errors.length > 0) bug("MEDIUM", path, `${errors.length} console errors`, errors[0]?.substring(0, 100));
  await page.close();
}

await browser.close();

// REPORT
console.log("\n" + "=".repeat(60));
console.log("  FULL AUDIT REPORT");
console.log("=".repeat(60));
const critical = bugs.filter(b => b.severity === "CRITICAL");
const high = bugs.filter(b => b.severity === "HIGH");
const medium = bugs.filter(b => b.severity === "MEDIUM");
console.log(`\n  CRITICAL: ${critical.length}  |  HIGH: ${high.length}  |  MEDIUM: ${medium.length}  |  TOTAL: ${bugs.length}\n`);
if (critical.length > 0) { console.log("  -- CRITICAL --"); critical.forEach((b, i) => console.log(`  ${i+1}. [${b.area}] ${b.description}${b.evidence ? "\n     " + b.evidence : ""}`)); }
if (high.length > 0) { console.log("\n  -- HIGH --"); high.forEach((b, i) => console.log(`  ${i+1}. [${b.area}] ${b.description}${b.evidence ? "\n     " + b.evidence : ""}`)); }
if (medium.length > 0) { console.log("\n  -- MEDIUM --"); medium.forEach((b, i) => console.log(`  ${i+1}. [${b.area}] ${b.description}${b.evidence ? "\n     " + b.evidence : ""}`)); }
console.log("\n" + "=".repeat(60));
