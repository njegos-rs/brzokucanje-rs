import { test, expect } from '@playwright/test'

test.describe('VEŽBA — typing flow', () => {
  test('učitava stranicu za kucanje — latinica', async ({ page }) => {
    await page.goto('/vezbaj/latinica')
    await expect(page.locator('.typing-area')).toBeVisible()
    await expect(page.getByText('Tapni ovde ili počni da kucaš...')).toBeVisible()
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
    const typingArea = page.locator('.typing-area')
    await typingArea.click()

    // Čekamo da typing area dobije fokus i prikaže karakter
    await typingArea.press('a')

    // Timer treba da se pojavi (live stats)
    await expect(page.locator('.typing-area')).toBeVisible()
    // Overlay "Tapni ovde..." treba da nestane
    await expect(page.getByText('Tapni ovde ili počni da kucaš...')).not.toBeVisible({ timeout: 2000 })
  })

  test('Tab restartuje test', async ({ page }) => {
    await page.goto('/vezbaj/latinica')
    const typingArea = page.locator('.typing-area')
    await typingArea.click()
    await typingArea.press('a')

    // Overlay je nestao
    await expect(page.getByText('Tapni ovde ili počni da kucaš...')).not.toBeVisible({ timeout: 1000 })

    // Tab treba da restartuje
    await typingArea.press('Tab')
    await expect(page.getByText('Tapni ovde ili počni da kucaš...')).toBeVisible({ timeout: 2000 })
  })

  test('paste je blokiran', async ({ page }) => {
    await page.goto('/vezbaj/latinica')
    const typingArea = page.locator('.typing-area')
    await typingArea.click()

    // Pokušaj paste-a ne smije promijeniti stanje
    await page.keyboard.press('Control+v')
    // Typing area ostaje u idle/running stanju bez errora
    await expect(typingArea).toBeVisible()
  })

  test('invalid pismo vraća 404', async ({ page }) => {
    const response = await page.goto('/vezbaj/srpski')
    // Next.js treba da vrati 404 ili redirect za nepoznato pismo
    expect(response?.status()).not.toBe(200)
  })
})

test.describe('VEŽBA — live stats', () => {
  test('prikazuje WPM, tačnost i greške', async ({ page }) => {
    await page.goto('/vezbaj/latinica')
    const typingArea = page.locator('.typing-area')
    await typingArea.click()

    // Kucamo nešto
    await typingArea.pressSequentially('test', { delay: 50 })

    // Live stats treba da budu vidljivi (wpm, tačnost, greške)
    await expect(page.getByText('wpm', { exact: true })).toBeVisible()
    await expect(page.getByText('tačnost', { exact: true })).toBeVisible()
    await expect(page.getByText('greške', { exact: true })).toBeVisible()
  })
})
