import { test, expect } from "@playwright/test";
import {
  scoreTemplate,
  formatScoreTable,
  type TemplateScore,
} from "../../helpers/template-scorer";

const TEMPLATES_TO_TEST = [
  { id: "TI05", hasFront: true, hasBack: true },
  { id: "TI06", hasFront: true, hasBack: true },
  { id: "TI07", hasFront: true, hasBack: true },
  { id: "TI08", hasFront: true, hasBack: true },
];

const PASS_THRESHOLD = 90;

test.describe("Canvas Builder V2 — Template Scoring", () => {
  for (const tmpl of TEMPLATES_TO_TEST) {
    test(`${tmpl.id} front page scores >= ${PASS_THRESHOLD}`, async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      // Navigate to Canvas Builder V2
      await page.goto("/de/builder-v2", { waitUntil: "networkidle" });

      // Select sterbebild card type
      await page.locator('[data-testid="card-type-sterbebild"]').click();
      await page.waitForTimeout(800);

      // Select template
      await page.locator(`[data-testid="template-${tmpl.id}"]`).click();
      await page.waitForTimeout(3000); // Wait for images to load

      // Score front page
      const score = await scoreTemplate(
        page,
        tmpl.id,
        "front",
        consoleErrors
      );

      // Take screenshot with score overlay
      await page.screenshot({
        path: `e2e/screenshots/${tmpl.id}-front-scored.png`,
        fullPage: false,
      });

      // Log score details
      console.log(`\n${tmpl.id} Front Page Score: ${score.total}/100`);
      for (const check of score.checks) {
        console.log(
          `  ${check.passed ? "PASS" : "FAIL"} ${check.name}: ${check.points}/${check.maxPoints} — ${check.detail}`
        );
      }

      expect(
        score.total,
        `${tmpl.id} front page score ${score.total} < ${PASS_THRESHOLD}`
      ).toBeGreaterThanOrEqual(PASS_THRESHOLD);
    });

    if (tmpl.hasBack) {
      test(`${tmpl.id} back page scores >= ${PASS_THRESHOLD}`, async ({
        page,
      }) => {
        const consoleErrors: string[] = [];
        page.on("console", (msg) => {
          if (msg.type() === "error") consoleErrors.push(msg.text());
        });

        await page.goto("/de/builder-v2", { waitUntil: "networkidle" });
        await page.locator('[data-testid="card-type-sterbebild"]').click();
        await page.waitForTimeout(800);
        await page.locator(`[data-testid="template-${tmpl.id}"]`).click();
        await page.waitForTimeout(3000);

        // Switch to back page
        const backTab = page.locator('button:has-text("Rückseite")');
        if ((await backTab.count()) > 0) {
          await backTab.click();
          await page.waitForTimeout(2000);
        }

        const score = await scoreTemplate(
          page,
          tmpl.id,
          "back",
          consoleErrors
        );
        await page.screenshot({
          path: `e2e/screenshots/${tmpl.id}-back-scored.png`,
          fullPage: false,
        });

        console.log(`\n${tmpl.id} Back Page Score: ${score.total}/100 (Gemini: ${score.geminiScore})`);
        for (const check of score.checks) {
          console.log(
            `  ${check.passed ? "PASS" : "FAIL"} ${check.name}: ${check.points}/${check.maxPoints} — ${check.detail}`
          );
        }
        if (score.geminiIssues.length > 0) {
          console.log("  Gemini Issues:");
          for (const i of score.geminiIssues) {
            console.log(`    #${i.rank} [${i.category}] sev=${i.severity}: ${i.description}`);
            if (i.fix) console.log(`       Fix: ${i.fix}`);
          }
        }

        expect(
          score.total,
          `${tmpl.id} back page score ${score.total} < ${PASS_THRESHOLD}`
        ).toBeGreaterThanOrEqual(PASS_THRESHOLD);
      });
    }
  }

  test("Score summary table", async ({ page }) => {
    const allScores: TemplateScore[] = [];
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    for (const tmpl of TEMPLATES_TO_TEST) {
      await page.goto("/de/builder-v2", { waitUntil: "networkidle" });
      consoleErrors.length = 0;

      await page.locator('[data-testid="card-type-sterbebild"]').click();
      await page.waitForTimeout(800);
      await page.locator(`[data-testid="template-${tmpl.id}"]`).click();
      await page.waitForTimeout(3000);

      allScores.push(
        await scoreTemplate(page, tmpl.id, "front", [...consoleErrors])
      );

      if (tmpl.hasBack) {
        const backTab = page.locator('button:has-text("Rückseite")');
        if ((await backTab.count()) > 0) {
          await backTab.click();
          await page.waitForTimeout(2000);
          allScores.push(
            await scoreTemplate(page, tmpl.id, "back", [...consoleErrors])
          );
        }
      }
    }

    console.log("\n" + formatScoreTable(allScores));

    // Verify all scores meet threshold
    for (const score of allScores) {
      expect(
        score.total,
        `${score.templateId} ${score.page} = ${score.total}`
      ).toBeGreaterThanOrEqual(PASS_THRESHOLD);
    }
  });
});
