import { expect, test } from '@playwright/test'

// Checks the deployed GitHub Pages site. Run with: npx playwright test e2e/live.spec.ts
const LIVE = 'https://asemmebled-ui.github.io/quickfire-9ma0/'

test('live site: installable PWA that works offline', async ({ page, context }) => {
  test.skip(!process.env.LIVE, 'set LIVE=1 to check the deployed site')
  await page.goto(LIVE)
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
  const manifest = await page.evaluate(async () => (await fetch(document.querySelector('link[rel=manifest]')!.getAttribute('href')!)).json())
  expect(manifest.display).toBe('standalone')
  for (const i of manifest.icons) expect((await page.request.get(new URL(i.src, LIVE).href)).ok()).toBe(true)
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 15000 }).toBe(true)
  await page.waitForTimeout(2000)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
  await page.getByRole('button', { name: "Start today's session" }).click()
  await expect(page.locator('.stem .katex').first()).toBeVisible()
  await context.setOffline(false)
})
