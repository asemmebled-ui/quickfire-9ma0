import { defineConfig, devices } from '@playwright/test'

// End-to-end tests run against the PRODUCTION build (so the service worker and offline mode are real).
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', ...devices['Pixel 7'], serviceWorkers: 'allow' },
  webServer: { command: 'node node_modules/vite/bin/vite.js preview --port 4173 --strictPort', port: 4173, reuseExistingServer: true },
})
