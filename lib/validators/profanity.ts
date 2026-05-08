// Starter lista srpskih psovki i uvredljivih reči za username filter.
// U Nedelji 5 ovo se refactoruje da čita iz Supabase tabele profanity_words.

const PROFANITY_LIST = [
  'kurac', 'kurca', 'kurcu', 'kurcem',
  'pizda', 'pizde', 'pizdi', 'pizdu',
  'picka', 'picke', 'picki', 'picku',
  'jebem', 'jebeni', 'jebiga', 'jebo',
  'govno', 'govno', 'govana',
  'sisa', 'sise',
  'drolja', 'kurva', 'kurve', 'kurvi',
  'majmune', 'idiot', 'idiote',
  'sranje', 'sranja',
  'mrtva', 'smrt',
  'admin', 'administrator', 'moderator', 'support', 'system',
  'brzokucanje', 'brzokucanjers',
]

// Leet speak normalizacija: a→@, e→3, i→1, o→0, s→$
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

export function containsProfanity(username: string): boolean {
  const normalized = normalizeLeet(username)
  return PROFANITY_LIST.some((word) => normalized.includes(word))
}

export function getProfanityList(): string[] {
  return [...PROFANITY_LIST]
}
