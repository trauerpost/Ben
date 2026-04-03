import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test("REAL mobile flow: homepage → tap Anmelden → login → dashboard", async ({ page }) => {
  const logs: string[] = [];
  page.on("request", (req) => {
    if (!req.url().includes("_next/static") && !req.url().includes("_rsc"))
      logs.push(`REQ: ${req.method()} ${req.url()}`);
  });
  page.on("response", (res) => {
    if (!res.url().includes("_next/static") && !res.url().includes("_rsc"))
      logs.push(`RES: ${res.status()} ${res.url()}`);
  });
  page.on("pageerror", (err) => logs.push(`PAGE_ERROR: ${err.message}`));

  // Step 1: Go to homepage like a real user
  await page.goto("https://trauerpost.vercel.app/de");
  await page.waitForLoadState("networkidle");
  console.log("STEP 1: On homepage, URL:", page.url());

  // Step 2: Find and tap the Anmelden button (mobile header)
  const anmeldenBtn = page.getByRole("link", { name: "Anmelden" });
  const isVisible = await anmeldenBtn.isVisible();
  console.log("STEP 2: Anmelden visible:", isVisible);

  if (!isVisible) {
    // Try hamburger menu
    const hamburger = page.locator("button[aria-label='Toggle menu']");
    if (await hamburger.isVisible()) {
      console.log("STEP 2b: Opening hamburger menu");
      await hamburger.click();
      await page.waitForTimeout(500);
    }
  }

  await anmeldenBtn.first().click();
  await page.waitForURL(/\/login/, { timeout: 10000 });
  console.log("STEP 3: On login page, URL:", page.url());

  // Step 3: Check what the form looks like
  const formEl = page.locator("form").first();
  const action = await formEl.getAttribute("action");
  const method = await formEl.getAttribute("method");
  console.log(`STEP 4: Form action="${action}" method="${method}"`);

  // Step 4: Fill credentials with test@ account
  await page.locator("#login-email").fill("test@trauerpost.com");
  await page.locator("#login-password").fill("Test1234!");

  // Verify values are in the inputs
  const emailVal = await page.locator("#login-email").inputValue();
  const passVal = await page.locator("#login-password").inputValue();
  console.log(`STEP 5: email="${emailVal}" password="${passVal.length > 0 ? '***' : 'EMPTY'}"`);

  // Step 5: Clear logs and submit
  logs.length = 0;
  await page.getByRole("button", { name: "Anmelden" }).click();

  // Step 6: Wait and see what happens
  await page.waitForTimeout(10000);
  console.log("STEP 6: FINAL URL:", page.url());
  console.log("NETWORK:");
  for (const l of logs) console.log(" ", l);

  // Check result
  if (page.url().includes("/dashboard")) {
    console.log("RESULT: SUCCESS - reached dashboard");
  } else if (page.url().includes("/login")) {
    const content = await page.content();
    const errorMatch = content.match(/bg-red-50[^>]*>([^<]*)</);
    console.log("RESULT: STILL ON LOGIN");
    console.log("Error visible:", errorMatch ? errorMatch[1] : "none");
    // Take screenshot
    await page.screenshot({ path: "test-results/mobile-login-fail.png" });
  } else {
    console.log("RESULT: UNEXPECTED URL:", page.url());
  }

  expect(page.url()).toContain("/dashboard");
});
