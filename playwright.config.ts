import { defineConfig, devices } from "@playwright/test";

const port = 5191;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    locale: "en-CA",
    timezoneId: "America/Toronto",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command:
      "npm run db:migrate:local && npm run db:reset:e2e && npm run db:seed:local && npm run build && npx vite preview --host 127.0.0.1 --port 5191",
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      CLOUDFLARE_INCLUDE_PROCESS_ENV: "true",
      VISITOR_HMAC_SECRET:
        "playwright-local-secret-that-is-longer-than-thirty-two-bytes",
      TURNSTILE_SITE_KEY: "",
      TURNSTILE_SECRET: "",
      TURNSTILE_HOSTNAME: "",
      TURNSTILE_ACTION: "suggestion",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
});
