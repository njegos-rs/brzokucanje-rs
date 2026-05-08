import { test, expect } from '@playwright/test'

test.describe('Prijava', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prijava')
  })

  test('prikazuje login formu', async ({ page }) => {
    await expect(page.getByText('Prijava')).toBeVisible()
    await expect(page.getByPlaceholder('janko@primer.rs')).toBeVisible()
    await expect(page.getByPlaceholder('Vaša lozinka')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Prijavi se' })).toBeVisible()
    await expect(page.getByText('Zaboravili ste lozinku?')).toBeVisible()
  })

  test('validacija — prazna polja', async ({ page }) => {
    await page.getByRole('button', { name: 'Prijavi se' }).click()
    await expect(page.locator('p.text-\\[var\\(--incorrect\\)\\]').first()).toBeVisible()
  })

  test('greška za pogrešne kredencijale', async ({ page }) => {
    await page.route('**/auth/v1/token*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
      })
    })

    await page.getByPlaceholder('janko@primer.rs').fill('nema@user.com')
    await page.getByPlaceholder('Vaša lozinka').fill('pogresna123')
    await page.getByRole('button', { name: 'Prijavi se' }).click()

    await expect(page.getByText('Pogrešan email ili lozinka.')).toBeVisible({ timeout: 5000 })
  })

  test('greška za neverifikovan email', async ({ page }) => {
    await page.route('**/auth/v1/token*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Email not confirmed' }),
      })
    })

    await page.getByPlaceholder('janko@primer.rs').fill('neverifik@test.com')
    await page.getByPlaceholder('Vaša lozinka').fill('lozinka123')
    await page.getByRole('button', { name: 'Prijavi se' }).click()

    await expect(page.getByText(/nije verifikovan/i)).toBeVisible({ timeout: 5000 })
  })

  test('uspješna prijava — redirect na homepage', async ({ page }) => {
    await page.route('**/auth/v1/token*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'fake-token',
          refresh_token: 'fake-refresh',
          token_type: 'bearer',
          expires_in: 3600,
          user: { id: 'user-id', email: 'test@test.com', aud: 'authenticated' },
        }),
      })
    })

    await page.getByPlaceholder('janko@primer.rs').fill('test@test.com')
    await page.getByPlaceholder('Vaša lozinka').fill('lozinka123')
    await page.getByRole('button', { name: 'Prijavi se' }).click()

    await expect(page).toHaveURL('/', { timeout: 5000 })
  })

  test('prikazuje/skriva lozinku', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('Vaša lozinka')
    await expect(passwordInput).toHaveAttribute('type', 'password')

    await page.getByRole('button', { name: 'Prikaži lozinku' }).click()
    await expect(passwordInput).toHaveAttribute('type', 'text')

    await page.getByRole('button', { name: 'Sakrij lozinku' }).click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('veza ka registraciji', async ({ page }) => {
    await page.getByRole('link', { name: 'Registruj se' }).click()
    await expect(page).toHaveURL('/registracija')
  })
})

test.describe('Zaboravljena lozinka', () => {
  test('prikazuje forgot password formu', async ({ page }) => {
    await page.goto('/prijava')
    await page.getByText('Zaboravili ste lozinku?').click()

    await expect(page.getByText('Reset lozinke')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Pošalji link' })).toBeVisible()
  })

  test('prikazuje potvrdu nakon slanja', async ({ page }) => {
    await page.goto('/prijava')
    await page.getByText('Zaboravili ste lozinku?').click()

    await page.route('**/auth/v1/recover', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })

    await page.getByPlaceholder('janko@primer.rs').fill('test@test.com')
    await page.getByRole('button', { name: 'Pošalji link' }).click()

    await expect(page.getByText('Link je poslat na vaš email.')).toBeVisible({ timeout: 5000 })
  })

  test('nazad na prijavu', async ({ page }) => {
    await page.goto('/prijava')
    await page.getByText('Zaboravili ste lozinku?').click()
    await page.getByText('← Nazad').click()
    await expect(page.getByText('Prijava')).toBeVisible()
  })
})
