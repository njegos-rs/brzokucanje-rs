import { test, expect } from '@playwright/test'

test.describe('Registracija', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/registracija')
  })

  test('prikazuje formu sa svim poljima', async ({ page }) => {
    await expect(page.getByText('Registracija')).toBeVisible()
    await expect(page.getByPlaceholder('janko123')).toBeVisible()
    await expect(page.getByPlaceholder('janko@primer.rs')).toBeVisible()
    await expect(page.getByPlaceholder('Najmanje 8 karaktera')).toBeVisible()
    await expect(page.getByPlaceholder('Ponovi lozinku')).toBeVisible()
  })

  test('validacija — prazna polja', async ({ page }) => {
    await page.getByRole('button', { name: 'Registruj se' }).click()
    // Zod validacija treba da prikaže greške
    await expect(page.locator('p.text-\\[var\\(--incorrect\\)\\]').first()).toBeVisible()
  })

  test('validacija — kratko korisničko ime', async ({ page }) => {
    await page.getByPlaceholder('janko123').fill('ab')
    await page.getByPlaceholder('janko@primer.rs').fill('test@test.com')
    await page.getByPlaceholder('Najmanje 8 karaktera').fill('lozinka123')
    await page.getByPlaceholder('Ponovi lozinku').fill('lozinka123')
    await page.getByRole('button', { name: 'Registruj se' }).click()
    await expect(page.locator('p.text-\\[var\\(--incorrect\\)\\]').first()).toBeVisible()
  })

  test('validacija — lozinke se ne poklapaju', async ({ page }) => {
    await page.getByPlaceholder('janko123').fill('korisnik123')
    await page.getByPlaceholder('janko@primer.rs').fill('test@test.com')
    await page.getByPlaceholder('Najmanje 8 karaktera').fill('lozinka123')
    await page.getByPlaceholder('Ponovi lozinku').fill('drugelozinka123')
    await page.getByRole('button', { name: 'Registruj se' }).click()
    await expect(page.locator('p.text-\\[var\\(--incorrect\\)\\]').first()).toBeVisible()
  })

  test('provjera dostupnosti korisničkog imena', async ({ page }) => {
    await page.getByPlaceholder('janko123').fill('test123')
    // Čeka debounce (400ms) + API odgovor
    await page.waitForTimeout(800)
    // Trebalo bi prikazati ili "slobodno" ili "zauzeto" ili loader
    const statusEl = page.locator('[data-testid="username-status"], .text-\\[var\\(--correct\\)\\], .text-\\[var\\(--incorrect\\)\\]').first()
    // Ne očekujemo konkretnu vrednost — samo da sistem reaguje
    await expect(statusEl).toBeVisible({ timeout: 3000 })
  })

  test('veza ka prijavi', async ({ page }) => {
    await page.getByRole('link', { name: 'Prijavi se' }).click()
    await expect(page).toHaveURL('/prijava')
  })

  test('prikazuje success screen nakon slanja', async ({ page }) => {
    // Mock: intercept Supabase signUp da vrati OK
    await page.route('**/auth/v1/signup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'test-id', email: 'novi@test.com', aud: 'authenticated' },
          session: null,
        }),
      })
    })

    const suffix = Date.now()
    await page.getByPlaceholder('janko123').fill(`korisnik${suffix}`)
    await page.waitForTimeout(500)
    await page.getByPlaceholder('janko@primer.rs').fill(`novi${suffix}@test.com`)
    await page.getByPlaceholder('Najmanje 8 karaktera').fill('lozinka123')
    await page.getByPlaceholder('Ponovi lozinku').fill('lozinka123')
    await page.getByRole('button', { name: 'Registruj se' }).click()

    await expect(page.getByText('Potvrdi email')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Poslali smo ti link za verifikaciju')).toBeVisible()
  })

  test('prikazuje grešku za već registrovan email', async ({ page }) => {
    await page.route('**/auth/v1/signup', async (route) => {
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ msg: 'User already registered', code: 422 }),
      })
    })

    await page.getByPlaceholder('janko123').fill('novikup')
    await page.waitForTimeout(500)
    await page.getByPlaceholder('janko@primer.rs').fill('postoji@test.com')
    await page.getByPlaceholder('Najmanje 8 karaktera').fill('lozinka123')
    await page.getByPlaceholder('Ponovi lozinku').fill('lozinka123')
    await page.getByRole('button', { name: 'Registruj se' }).click()

    await expect(page.getByText(/registrovana/i)).toBeVisible({ timeout: 5000 })
  })
})
