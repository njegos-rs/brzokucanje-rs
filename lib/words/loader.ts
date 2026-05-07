type Script = 'latinica' | 'cirilica' | 'easy'
type Difficulty = 'lake' | 'srednje' | 'teske'

const cache: Partial<Record<string, string[]>> = {}

export async function loadWords(script: Script, difficulty: Difficulty): Promise<string[]> {
  const key = `${script}/${difficulty}`
  if (cache[key]) return cache[key]!

  const mod = await import(`@/lib/words/${script}/${difficulty}.json`)
  cache[key] = mod.default as string[]
  return cache[key]!
}

export function buildWordTest(words: string[], count = 30): string {
  const shuffled = [...words].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length)).join(' ')
}
