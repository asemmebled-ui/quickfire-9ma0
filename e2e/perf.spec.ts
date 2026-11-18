import { expect, test } from '@playwright/test'

// Mid-range phone emulation: 4x CPU slowdown. Cold load also throttles the network (~1.6 Mbps, 150 ms RTT).
test('loads in under 2 s on a throttled mid-range phone (repeat visit) and reports the cold load', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP throttling is Chromium-only')
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
  let t = Date.now()
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible({ timeout: 30000 })
  const cold = Date.now() - t
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.reload()
  await page.waitForTimeout(1500)
  t = Date.now()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
  const warm = Date.now() - t
  // tab switch (transition) time
  t = Date.now()
  await page.getByRole('button', { name: 'Progress' }).click()
  await expect(page.locator('.summary')).toBeVisible()
  const transition = Date.now() - t
  console.log(`PERF cold first visit (throttled network + CPU): ${cold} ms; repeat visit from service worker: ${warm} ms; tab transition: ${transition} ms`)
  expect(warm).toBeLessThan(2000)
})
