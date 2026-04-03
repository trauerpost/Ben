import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test("mobile login form POST debug", async ({ page }) => {
  const logs: string[] = [];

  page.on("request", (req) => {
    if (!req.url().includes("_next/static")) {
      logs.push(`REQ: ${req.method()} ${req.url()}`);
    }
  });

  page.on("response", (res) => {
    if (!res.url().includes("_next/static")) {
      logs.push(`RES: ${res.status()} ${res.url()}`);
    }
  });

  page.on("console", (msg) => {
    logs.push(`CONSOLE ${msg.type()}: ${msg.text()}`);
  });

  page.on("pageerror", (err) => {
    logs.push(`PAGE_ERROR: ${err.message}`);
  });

  await page.goto("https://trauerpost.vercel.app/de/login");
  await page.waitForLoadState("networkidle");

  // Check form attributes in DOM
  const formAction = await page.locator("form").first().getAttribute("action");
  const formMethod = await page.locator("form").first().getAttribute("method");
  console.log(`FORM: action=${formAction} method=${formMethod}`);

  // Fill
  await page.locator("#login-email").fill("jess@trauerpost.com");
  await page.locator("#login-password").fill("SoundGarden!");

  logs.length = 0;

  // Submit
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForTimeout(8000);

  console.log(`FINAL_URL: ${page.url()}`);
  console.log("--- NETWORK LOG ---");
  for (const l of logs) {
    console.log(l);
  }
  console.log("--- END ---");

  // This test is for debugging — check if we reached dashboard
  const url = page.url();
  if (url.includes("/dashboard")) {
    console.log("SUCCESS: Reached dashboard");
  } else if (url.includes("/login")) {
    console.log("FAIL: Still on login page");
    const pageContent = await page.content();
    const hasError = pageContent.includes("bg-red-50");
    console.log(`Has error div: ${hasError}`);
  } else {
    console.log(`UNEXPECTED URL: ${url}`);
  }
});
