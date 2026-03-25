import { defineConfig } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local" });

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: "https://trauerpost.vercel.app",
    headless: true,
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
