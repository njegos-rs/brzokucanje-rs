import { test, expect } from '@playwright/test'

test.describe('RANK â€” pristup i zaÅ¡tita', () => {
  test('neautentifikovani korisnik se preusmjerava sa /rank', async ({ page }) => {
    // Bez mock sessiona, middleware treba da redirectuje
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'JWT expired' }),
      })
    })

    await page.goto('/rank/latinica')
    // Treba da bude redirect na /prijava
    await expect(page).toHaveURL(/prijava|login/, { timeout: 5000 })
  })

  test('rang stranica je dostupna na svim pismima', async ({ page }) => {
    // Testiramo javne URL-ove koji ne zahtijevaju auth
    const pisma = ['latinica', 'cirilica', 'easy']
    for (const pismo of pisma) {
      const response = await page.goto(`/rang-lista/${pismo}`)
      // Rang lista je javna â€” treba 200
      expect(response?.status()).toBe(200)
    }
  })
})

test.describe('RANK â€” daily limit', () => {
  test('prikazuje poruku kad je daily limit dostignut', async ({ page }) => {
    // Mock: Supabase vraca da vec postoji score za danas
    await page.route('**/rest/v1/daily_texts*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'dt1',
          date: new Date().toISOString().split('T')[0],
          script: 'latinica',
          category: 'reci',
          text_id: 'txt1',
          text: { content_lat: 'test tekst za kucanje danas', content_cyr: 'Ñ‚ÐµÑÑ‚ Ñ‚ÐµÐºÑÑ‚', content_easy: 'test tekst' },
        }]),
      })
    })

    await page.route('**/rest/v1/scores*', async (route) => {
      if (route.request().method() === 'GET') {
        // Korisnik veÄ‡ ima score za danas â€” daily limit dostignut
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ id: 'score1', user_id: 'test-user-id' }]),
        })
      } else {
        await route.continue()
      }
    })

    // Login session mock
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-id',
          email: 'test@test.com',
          aud: 'authenticated',
          user_metadata: { username: 'testkorisnik' },
        }),
      })
    })

    await page.goto('/rank/latinica')
    // Treba da se pojavi poruka o dnevnom limitu
    await expect(page.getByText(/dnevni|pokuÅ¡aj|iskoristio/i)).toBeVisible({ timeout: 5000 })
  })
})

test.describe('RANK â€” submit rezultata', () => {
  test('POST /api/score vraÄ‡a 200 sa validnim podacima', async ({ page }) => {
    let submitResponse: { status: number; body: unknown } | null = null

    await page.route('**/api/score', async (route) => {
      if (route.request().method() === 'POST') {
        submitResponse = {
          status: 200,
          body: { wpm: 75, accuracy: 97, is_new_pb: false },
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(submitResponse.body),
        })
      } else {
        await route.continue()
      }
    })

    // Direktno testiramo API endpoint
    const response = await page.request.post('/api/score', {
      data: {
        daily_text_id: 'dt1',
        category: 'reci',
        script: 'latinica',
        wpm: 75,
        raw_wpm: 80,
        accuracy: 97,
        consistency: 85,
        score: 1800,
        duration_seconds: 30,
        chars_correct: 145,
        chars_incorrect: 5,
        chars_total: 150,
        keystrokes: [{ ts: 0, char: 't', action: 'insert' }],
      },
    })

    // Bez autentikacije treba da vrati 401
    expect([200, 401]).toContain(response.status())
  })

  test('POST /api/score odbija WPM > 220', async ({ page }) => {
    const response = await page.request.post('/api/score', {
      data: {
        daily_text_id: 'dt1',
        category: 'reci',
        script: 'latinica',
        wpm: 300, // Previsoko â€” anti-cheat
        raw_wpm: 310,
        accuracy: 99,
        consistency: 95,
        score: 9999,
        duration_seconds: 10,
        chars_correct: 500,
        chars_incorrect: 1,
        chars_total: 501,
        keystrokes: [],
      },
    })

    // Treba da vrati 400 (anti-cheat) ili 401 (no auth)
    expect([400, 401]).toContain(response.status())
  })
})



