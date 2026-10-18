// Playwright runs the app in a phone-sized browser and clicks through it.
// Run: npm test   (first time only: npx playwright install chromium)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:5500', ...devices['Pixel 7'] },
  webServer: {
    command: 'npx http-server . -p 5500 -c-1 -s',
    url: 'http://127.0.0.1:5500/index.html',
    reuseExistingServer: true,
  },
});
