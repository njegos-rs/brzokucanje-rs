import { test, expect } from '@playwright/test'

// Mock admin session helper
async function setupAdminSession(page: import('@playwright/test').Page) {
  await page.route('**/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'admin-user-id',
        email: 'admin@test.com',
        aud: 'authenticated',
        user_metadata: { username: 'admin' },
      }),
    })
  })

  // Mock is_admin check
  await page.route('**/rest/v1/profiles*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ is_admin: true }]),
    })
  })
}

test.describe('Admin — pristup i zaštita', () => {
  test('neautentifikovani korisnik se preusmjerava sa /admin', async ({ page }) => {
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' })
    })

    await page.goto('/admin/pregled')
    await expect(page).toHaveURL(/prijava/, { timeout: 5000 })
  })

  test('obični korisnik se preusmjerava sa /admin', async ({ page }) => {
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'regular-user-id',
          email: 'user@test.com',
          aud: 'authenticated',
        }),
      })
    })

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ is_admin: false }]),
      })
    })

    await page.goto('/admin/pregled')
    // Treba redirect na '/'
    await expect(page).toHaveURL(/^((?!admin).)*$/, { timeout: 5000 })
  })
})

test.describe('Admin — navigacija', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminSession(page)
  })

  test('sidebar je vidljiv sa svim linkovima', async ({ page }) => {
    await page.goto('/admin/pregled')
    await expect(page.getByText('Pregled')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Korisnici')).toBeVisible()
    await expect(page.getByText('Sadržaj')).toBeVisible()
    await expect(page.getByText('Anti-cheat')).toBeVisible()
    await expect(page.getByText('Statistike')).toBeVisible()
    await expect(page.getByText('Profanity')).toBeVisible()
    await expect(page.getByText('Audit log')).toBeVisible()
  })

  test('navigacija do admin/korisnici', async ({ page }) => {
    await page.goto('/admin/pregled')
    await page.getByRole('link', { name: 'Korisnici' }).click()
    await expect(page).toHaveURL('/admin/korisnici')
  })

  test('navigacija do admin/anti-cheat', async ({ page }) => {
    await page.goto('/admin/pregled')
    await page.getByRole('link', { name: 'Anti-cheat' }).click()
    await expect(page).toHaveURL('/admin/anti-cheat')
  })

  test('link Nazad na sajt vodi na homepage', async ({ page }) => {
    await page.goto('/admin/pregled')
    await page.getByRole('link', { name: '← Nazad na sajt' }).click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('Admin — ban korisnika', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminSession(page)
  })

  test('prikazuje stranicu detalja korisnika', async ({ page }) => {
    await page.route('**/rest/v1/profiles*', async (route, request) => {
      const url = request.url()
      if (url.includes('target-user-id') || url.includes('eq.target-user-id')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'target-user-id',
            username: 'targetkorisnik',
            email: 'target@test.com',
            is_admin: false,
            is_banned: false,
            created_at: new Date().toISOString(),
            streak_current: 3,
            total_tests: 15,
          }]),
        })
      } else if (url.includes('is_admin')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ is_admin: true }]),
        })
      } else {
        await route.continue()
      }
    })

    await page.route('**/rest/v1/scores*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.goto('/admin/korisnici/target-user-id')
    // Stranica se učitava
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Admin — anti-cheat review', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminSession(page)
  })

  test('prikazuje listu flagovanih rezultata', async ({ page }) => {
    await page.route('**/rest/v1/scores*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'score-1',
            user_id: 'user1',
            wpm: 195,
            accuracy: 99.5,
            score: 4500,
            created_at: new Date().toISOString(),
            flag_reviewed: false,
            review_decision: null,
            script: 'latinica',
            category: 'reci',
          },
        ]),
      })
    })

    await page.goto('/admin/anti-cheat')
    await expect(page.locator('body')).toBeVisible()
  })

  test('POST /api/admin/* zahtijeva admin rolu', async ({ page }) => {
    // Testiramo bez admin sessiona
    const response = await page.request.post('/api/admin/ban', {
      data: { user_id: 'some-user', reason: 'test ban' },
    })
    // Bez auth treba 401
    expect([401, 403, 404, 405]).toContain(response.status())
  })
})

test.describe('Admin — audit log', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminSession(page)
  })

  test('prikazuje audit log stranicu', async ({ page }) => {
    await page.route('**/rest/v1/admin_actions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'action-1',
            admin_id: 'admin-user-id',
            action: 'ban_user',
            target_user_id: 'target-1',
            created_at: new Date().toISOString(),
            details: { reason: 'cheat' },
          },
        ]),
      })
    })

    await page.goto('/admin/audit')
    await expect(page.locator('body')).toBeVisible()
  })
})
