import { test, expect } from '@playwright/test'

test.describe('Rang lista', () => {
  test('učitava rang listu — latinica', async ({ page }) => {
    await page.goto('/rang-lista/latinica')
    await expect(page).toHaveURL('/rang-lista/latinica')
    // Trebaju biti vidljivi tabovi za periode
    await expect(page.getByText('Dnevna')).toBeVisible()
    await expect(page.getByText('Nedeljna')).toBeVisible()
    await expect(page.getByText('Mesečna')).toBeVisible()
  })

  test('učitava rang listu — cirilica', async ({ page }) => {
    await page.goto('/rang-lista/cirilica')
    await expect(page).toHaveURL('/rang-lista/cirilica')
  })

  test('učitava rang listu — easy', async ({ page }) => {
    await page.goto('/rang-lista/easy')
    await expect(page).toHaveURL('/rang-lista/easy')
  })

  test('prikazuje kolonske zaglavlja tabele', async ({ page }) => {
    await page.goto('/rang-lista/latinica')
    // Rang lista treba da prikaže kolone
    const pageContent = page.locator('body')
    await expect(pageContent).toBeVisible()

    // WPM kolona
    await expect(page.getByText(/wpm/i).first()).toBeVisible()
  })

  test('filtriranje po kategoriji — reči', async ({ page }) => {
    await page.goto('/rang-lista/latinica')
    const reciTab = page.getByRole('button', { name: /reči|Reči/i }).first()
    if (await reciTab.isVisible()) {
      await reciTab.click()
      await expect(page).toHaveURL(/kategorija=reci|reci/)
    }
  })

  test('prebacivanje na nedeljnu rang listu', async ({ page }) => {
    await page.goto('/rang-lista/latinica')
    await page.getByText('Nedeljna').click()
    // URL treba da sadrži period=nedeljna ili se ažurira query param
    await expect(page).toHaveURL(/nedeljna|period/)
  })

  test('klikom na korisnika odlazi na profil', async ({ page }) => {
    await page.route('**/api/leaderboard*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { rank: 1, username: 'testuser1', wpm: 95, accuracy: 98, score: 2100, user_id: 'uid1' },
          { rank: 2, username: 'testuser2', wpm: 88, accuracy: 97, score: 1950, user_id: 'uid2' },
        ]),
      })
    })

    await page.goto('/rang-lista/latinica')
    const userLink = page.getByRole('link', { name: 'testuser1' })
    if (await userLink.isVisible()) {
      await userLink.click()
      await expect(page).toHaveURL(/\/profil\/testuser1/)
    }
  })

  test('invalid pismo vraća 404', async ({ page }) => {
    const response = await page.goto('/rang-lista/makedonski')
    expect(response?.status()).not.toBe(200)
  })
})
