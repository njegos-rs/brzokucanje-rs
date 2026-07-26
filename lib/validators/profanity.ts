const FALLBACK_LIST = [
  // Psovke i seksualne uvrede
  'kurac', 'kurca', 'kurcu', 'kurcem', 'kurčina',
  'pizda', 'pizde', 'pizdi', 'pizdu', 'pička', 'picka',
  'jebem', 'jebeš', 'jebes', 'jebeni', 'jebena', 'jebiga', 'jebo', 'odjebi',
  'govno', 'govana', 'sranje', 'sranja',
  'drolja', 'kurva', 'kurve', 'kurvi', 'kučka', 'kucka',
  'sisa', 'sise', 'pedofil',

  // Lične uvrede
  'idiot', 'idiote', 'debil', 'debilu', 'retard', 'majmun', 'majmune',
  'kreten', 'kretenu', 'stoka', 'ološ', 'olos', 'budala', 'glupan',

  // Nacionalne, verske i rasne uvrede/etikete
  'balija', 'balije', 'šiptar', 'siptar', 'ustaša', 'ustasa', 'četnik', 'cetnik',
  'cigan', 'cigani', 'niger', 'crnčuga', 'crncuga',
  'hrvat', 'hrvati', 'srbin', 'srbi', 'bošnjak', 'bosnjak',
  'musliman', 'muslinam', 'muslimani', 'jevrej', 'jevreji',
  'katolik', 'pravoslavac', 'albanac', 'albanci',

  // Pretnje i pozivi na nasilje
  'ubij', 'ubiti', 'ubijte', 'ubicu', 'ubiću', 'zakolji', 'zaklati', 'kolji',
  'siluj', 'silovati', 'streljaj', 'streljati', 'bombarduj', 'mrzim',
  'smrt', 'genocid', 'nacista', 'nacizam',

  // Lažno predstavljanje
  'admin', 'administrator', 'moderator', 'support', 'system',
  'brzokucanje', 'brzokucanjers',
]

function normalizeLeet(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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
  return list.some((word) => normalized.includes(normalizeLeet(word)))
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
