const GEMINI_MODEL = 'gemini-2.0-flash-lite'
const GEMINI_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export function removeAccents(text: string): string {
  return text
    .replace(/š/g, 's').replace(/Š/g, 'S')
    .replace(/č/g, 'c').replace(/Č/g, 'C')
    .replace(/ć/g, 'c').replace(/Ć/g, 'C')
    .replace(/đ/g, 'dj').replace(/Đ/g, 'Dj')
    .replace(/ž/g, 'z').replace(/Ž/g, 'Z')
}

function cleanJson(raw: string): string {
  return raw.replace(/```json\n?|```/g, '').trim()
}

function getApiKeys(): string[] {
  return [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter(Boolean) as string[]
}

async function callWithKey(prompt: string, apiKey: string): Promise<string[]> {
  const res = await fetch(`${GEMINI_BASE}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini ${res.status}: ${err}`)
  }

  const json = await res.json()
  const raw: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
  const parsed = JSON.parse(cleanJson(raw))

  if (!Array.isArray(parsed)) throw new Error('Gemini nije vratio JSON niz')
  return (parsed as unknown[]).map(String).filter(s => s.trim().length > 0)
}

export async function callGemini(prompt: string): Promise<string[]> {
  const keys = getApiKeys()
  let lastError: Error = new Error('Nema API ključeva')

  for (const key of keys) {
    try {
      return await callWithKey(prompt, key)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      // Ako je 429 ili 403, probaj sledeći ključ
      if (lastError.message.includes('429') || lastError.message.includes('403')) {
        await sleep(500)
        continue
      }
      // Ostale greške — ne probaj dalje
      throw lastError
    }
  }

  throw lastError
}

export function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}
