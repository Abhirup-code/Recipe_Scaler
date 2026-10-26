import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

/**
 * End-to-end tests run in a real browser against the production build in ./out
 * (run `npm run build` first). CI installs Chromium with `npx playwright install`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    // Optional: point at an already-installed Chromium instead of downloading one.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [{ name: "mobile-chrome", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: `npx --yes serve@14.2.5 out -l ${PORT} --no-clipboard`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
