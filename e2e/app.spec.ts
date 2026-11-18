import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

async function answerCurrent(page: Page) {
  // Answer whatever kind of question is showing, then submit with a confidence rating.
  const opt = page.locator('.opt').first()
  const num = page.locator('input.field[inputmode="decimal"]')
  if (await opt.isVisible().catch(() => false)) await opt.click()
  else if (await num.isVisible().catch(() => false)) await num.fill('1')
  else if (await page.getByRole('button', { name: 'Type as plain text' }).isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Type as plain text' }).click()
    await page.getByLabel('Your answer').fill('x')
  } else if (await page.locator('input[aria-label="Your answer"]').isVisible().catch(() => false)) await page.getByLabel('Your answer').fill('x')
  await page.getByRole('button', { name: 'Unsure' }).click()
}

test('today session: answer, get feedback with rendered maths, progress is recorded', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
  await expect(page.getByText(/days to Paper 1/)).toBeVisible()
  await page.getByRole('button', { name: "Start today's session" }).click()
  await expect(page.locator('.stem')).toBeVisible()
  expect(await page.locator('.katex-error').count()).toBe(0)
  for (let k = 0; k < 3; k++) {
    await answerCurrent(page)
    await expect(page.locator('.feedback')).toBeVisible()
    const save = page.getByRole('button', { name: /Save .* marks and continue/ })
    if (await save.isVisible().catch(() => false)) await save.click()
    else if (await page.getByRole('button', { name: 'Got it' }).isVisible().catch(() => false)) await page.getByRole('button', { name: 'Got it' }).click()
    else await page.getByRole('button', { name: 'Next' }).click()
  }
  await page.getByRole('button', { name: 'End' }).click().catch(() => {})
  await page.getByRole('button', { name: 'Progress' }).click()
  await expect(page.locator('.summary')).toContainText('/300')
  await expect(page.locator('.gauge')).toBeVisible()
  await expect(page.locator('.hcell').first()).toBeVisible()
})

test('expression input via the maths keyboard is marked by equivalence', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Practise' }).click()
  // drill the chain-rule generator through focus mode on Pure Y2 differentiation
  await page.getByRole('button', { name: 'More' }).click()
  await page.getByText('Ch 9: Differentiation (chain', { exact: false }).click()
  await page.getByRole('button', { name: 'Practise' }).click()
  await page.getByLabel('Topic').selectOption('p2.9')
  await page.getByRole('button', { name: 'Practise this topic' }).click()
  await expect(page.locator('.stem')).toBeVisible()
  let sawExpr = false
  for (let k = 0; k < 12 && !sawExpr; k++) {
    if (await page.locator('math-field, .mathinput').first().isVisible().catch(() => false)) {
      sawExpr = true
      await expect(page.locator('math-field')).toBeVisible({ timeout: 10000 })
      await page.locator('math-field').evaluate((el: HTMLElement & { value: string }) => { el.value = 'x'; el.dispatchEvent(new Event('input', { bubbles: true })) })
      await page.getByRole('button', { name: 'Sure', exact: true }).click()
      await expect(page.locator('.verdict')).toHaveText(/Not quite/)
      await expect(page.locator('.feedback')).toContainText('Answer:')
      break
    }
    await answerCurrent(page)
    const save = page.getByRole('button', { name: /Save .* marks and continue/ })
    if (await save.isVisible().catch(() => false)) await save.click(); else await page.getByRole('button', { name: 'Next' }).click()
  }
  expect(sawExpr).toBe(true)
})

test('mark topics covered, log a past paper, and see readiness uncapped', async ({ page }) => {
  await page.goto('/#papers')
  await page.getByRole('button', { name: 'Log' }).first().click()
  for (let k = 0; k < 10; k++) {
    await page.getByLabel(`Question ${k + 1} marks got`).fill('8')
    await page.getByLabel(`Question ${k + 1} max marks`).fill('10')
  }
  await page.getByLabel('Question 1 topic').selectOption('p1.12')
  await expect(page.getByText('Total: 80/100')).toBeVisible()
  await page.getByRole('button', { name: 'Save paper' }).click()
  await expect(page.getByText(/Logged .* 80\/100/)).toBeVisible()
  await page.getByRole('button', { name: 'Progress' }).click()
  await expect(page.getByText('capped: no timed paper')).toHaveCount(0)
})

test('backup download, copy and restore round trip (no pop-up dialogs)', async ({ page }) => {
  await page.goto('/#more')
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download backup' }).click()])
  const json = JSON.parse(readFileSync((await download.path())!, 'utf8'))
  expect(json.app).toBe('quickfire-9ma0')
  page.on('dialog', () => { throw new Error('the app must not use pop-up dialogs') })
  await page.locator('#restore-file').setInputFiles({ name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(json)) })
  await page.getByRole('button', { name: 'Replace my data' }).click()
  await expect(page.getByText(/Restored \d+ cards/)).toBeVisible()
  // pasted-text restore path, with an invalid paste first
  await page.getByText('Restore from pasted text').click()
  await page.getByLabel('Backup text').fill('not json')
  await page.getByRole('button', { name: 'Restore from this text' }).click()
  await page.getByRole('button', { name: 'Replace my data' }).click()
  await expect(page.getByText(/not valid backup text/)).toBeVisible()
  await page.getByLabel('Backup text').fill(JSON.stringify(json))
  await page.getByRole('button', { name: 'Restore from this text' }).click()
  await page.getByRole('button', { name: 'Replace my data' }).click()
  await expect(page.getByText(/Restored \d+ cards/)).toBeVisible()
  await expect(page).toHaveURL(/#more$/)
})

test('PWA: manifest, icons, service worker, and works fully offline', async ({ page, context }) => {
  await page.goto('/')
  const manifest = await page.evaluate(async () => {
    const href = document.querySelector('link[rel=manifest]')?.getAttribute('href')
    return href ? (await fetch(href)).json() : null
  })
  expect(manifest).toBeTruthy()
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons.some((i: { sizes: string }) => i.sizes === '512x512')).toBe(true)
  expect(manifest.icons.some((i: { sizes: string }) => i.sizes === '192x192')).toBe(true)
  for (const i of manifest.icons) expect((await page.request.get(i.src)).ok()).toBe(true)
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 15000 }).toBe(true)
  // wait for precache to finish
  await page.waitForTimeout(1500)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
  await page.getByRole('button', { name: "Start today's session" }).click()
  await expect(page.locator('.stem .katex').first()).toBeVisible()
  // fonts come from the cache too
  const fontsOk = await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].some((f) => f.family.includes('KaTeX') && f.status === 'loaded') })
  expect(fontsOk).toBe(true)
  await context.setOffline(false)
})
