import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test("verify formAction survives React hydration", async ({ page }) => {
  page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message));

  await page.goto("https://trauerpost.vercel.app/de/login");
  await page.waitForLoadState("networkidle");
  // Wait extra for React hydration to complete
  await page.waitForTimeout(5000);

  // Check button's formAction AFTER hydration
  const btn = page.getByRole("button", { name: "Anmelden" });
  const formActionAttr = await btn.getAttribute("formaction");
  const formActionProp = await btn.evaluate((el: HTMLButtonElement) => el.formAction);
  console.log("formaction attribute:", formActionAttr);
  console.log("formAction property:", formActionProp);

  // Check form action AFTER hydration
  const form = page.locator("form").first();
  const actionAttr = await form.getAttribute("action");
  const actionProp = await form.evaluate((el: HTMLFormElement) => el.action);
  console.log("form action attribute:", actionAttr);
  console.log("form action property:", actionProp);

  // Check the full button HTML
  const btnHtml = await btn.evaluate((el) => el.outerHTML);
  console.log("button HTML:", btnHtml.substring(0, 200));

  // ACTUAL SUBMIT TEST — intercept the POST
  const [request] = await Promise.all([
    page.waitForRequest((req) => req.method() === "POST", { timeout: 10000 }),
    (async () => {
      await page.locator("#login-email").fill("test@trauerpost.com");
      await page.locator("#login-password").fill("Test1234!");
      await btn.click();
    })(),
  ]);

  console.log("POST went to:", request.url());
  console.log("POST method:", request.method());

  await page.waitForTimeout(5000);
  console.log("Final URL:", page.url());

  expect(page.url()).toContain("/dashboard");
});
