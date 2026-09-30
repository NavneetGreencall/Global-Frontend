import { defineConfig, devices } from "@playwright/test";
const integration = process.env.E2E_INTEGRATION === "true";
if (integration && !process.env.E2E_BASE_URL) {
  throw new Error("Integration tests require an explicitly approved E2E_BASE_URL.");
}
const frontendPort = process.env.E2E_FRONTEND_PORT ?? "8080";
const localFrontendOrigin = `http://localhost:${frontendPort}`;
const frontendServer = {
  command: `npm run dev -- --host localhost --port ${frontendPort}`,
  url: `${localFrontendOrigin}/auth`,
  env: {
    ...process.env,
    VITE_API_URL: "/api/v1",
  },
  reuseExistingServer: false,
  timeout: 120_000,
};

export default defineConfig({
  testDir: "./e2e",
  // Default suite uses synthetic browser fixtures, not real accounts or a database.
  testMatch: integration
    ? "**/*.spec.ts"
    : ["**/public-accessibility.spec.ts", "**/document-preview.spec.ts"],
  timeout: 180_000,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  webServer: integration ? undefined : [frontendServer],
  use: {
    baseURL: integration ? process.env.E2E_BASE_URL : localFrontendOrigin,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
