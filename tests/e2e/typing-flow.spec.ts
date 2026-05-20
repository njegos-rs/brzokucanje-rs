import { test, expect } from '@playwright/test'

function typingInput(page: import('@playwright/test').Page) {
  return page.getByLabel('Oblast za unos')
}

test.describe('VEŽBA — typing flow', () => {
  test('učitava stranicu za kucanje — latinica', async ({ page }) => {
    await page.goto('/vezbaj/latinica')
    await expect(page.locator('.typing-area')).toBeVisible()
    await expect(typingInput(page)).toBeVisible()
  })

  test('učitava stranicu za kucanje — cirilica', async ({ page }) => {
    await page.goto('/vezbaj/cirilica')
    await expect(page.locator('.typing-area')).toBeVisible()
  })

  test('učitava stranicu za kucanje — easy', async ({ page }) => {
    await page.goto('/vezbaj/easy')
    await expect(page.locator('.typing-area')).toBeVisible()
  })

  test('test počinje kucanjem prvog karaktera', async ({ page }) => {
    await page.goto('/vezbaj/latinica')
    const typingArea = typingInput(page)
    await typingArea.focus()

    await typingArea.press('a')

    await expect(page.getByText('wpm', { exact: true })).toBeVisible()
  })

  test('Tab restartuje test', async ({ page }) => {
    await page.goto('/vezbaj/latinica')
    const typingArea = typingInput(page)
    await typingArea.focus()
    await typingArea.press('a')

    await expect(page.getByText('wpm', { exact: true })).toBeVisible()

    await typingArea.press('Tab')
    await expect(page.getByText('wpm', { exact: true })).not.toBeVisible({ timeout: 2000 })
  })

  test('paste je blokiran', async ({ page }) => {
    await page.goto('/vezbaj/latinica')
    const typingArea = typingInput(page)
    await typingArea.focus()

    await page.keyboard.press('Control+v')
    await expect(typingArea).toBeVisible()
  })

  test('invalid pismo prikazuje 404 stranicu', async ({ page }) => {
    await page.goto('/vezbaj/srpski')
    await expect(page).toHaveTitle(/404|Not Found/i)
  })
})

test.describe('VEŽBA — live stats', () => {
  test('prikazuje WPM, tačnost i greške', async ({ page }) => {
    await page.goto('/vezbaj/latinica')
    const typingArea = typingInput(page)
    await typingArea.focus()

    await typingArea.pressSequentially('test', { delay: 50 })

    await expect(page.getByText('wpm', { exact: true })).toBeVisible()
    await expect(page.getByText('tačnost', { exact: true })).toBeVisible()
    await expect(page.getByText('greške', { exact: true })).toBeVisible()
  })
})
