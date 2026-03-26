import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local" });

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  retries: 0,
  use: {
    baseURL: "https://trauerpost.vercel.app",
    headless: true,
    screenshot: "only-on-failure",
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "webkit-mobile",
      use: { ...devices["iPhone 14"] },
    },
    {
      name: "firefox",
      use: { browserName: "firefox", viewport: { width: 390, height: 844 } },
    },
  ],
});
