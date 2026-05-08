const FALLBACK_LIST = [
  'kurac', 'kurca', 'kurcu', 'kurcem',
  'pizda', 'pizde', 'pizdi', 'pizdu',
  'picka', 'picke', 'picki', 'picku',
  'jebem', 'jebeni', 'jebiga', 'jebo',
  'govno', 'govana',
  'sisa', 'sise',
  'drolja', 'kurva', 'kurve', 'kurvi',
  'majmune', 'idiot', 'idiote',
  'sranje', 'sranja',
  'admin', 'administrator', 'moderator', 'support', 'system',
  'brzokucanje', 'brzokucanjers',
]

function normalizeLeet(word: string): string {
  return word
    .toLowerCase()
    .replace(/@/g, 'a')
    .replace(/3/g, 'e')
    .replace(/1/g, 'i')
    .replace(/0/g, 'o')
    .replace(/\$/g, 's')
    .replace(/5/g, 's')
    .replace(/4/g, 'a')
    .replace(/7/g, 't')
}

export function containsProfanity(username: string, list: string[] = FALLBACK_LIST): boolean {
  const normalized = normalizeLeet(username)
  return list.some((word) => normalized.includes(word))
}

// Server-side: učitava listu iz baze, fallback na hardcoded
export async function getProfanityListFromDb(): Promise<string[]> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data } = await supabase.from('profanity_words').select('word')
    if (data && data.length > 0) return data.map((r) => r.word)
  } catch {
    // fallback
  }
  return [...FALLBACK_LIST]
}
