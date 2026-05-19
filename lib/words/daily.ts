import { loadWords, loadTexts, buildWordTest, applyRules } from '@/lib/words/loader'
import { makeRng } from '@/lib/prng'
import type { Script as WordScript } from '@/lib/words/loader'
import type { TestLevel } from '@/lib/typing/engine'

const scripts = ['cirilica', 'latinica', 'latinica-bez-kvacica'] as const
export type DailyScript = (typeof scripts)[number]

function dateToSeed(dateStr: string): number {
  return dateStr.split('-').reduce((acc, part) => acc * 1000 + parseInt(part), 0)
}

const DIFFICULTY_BY_DOW: TestLevel[] = ['easy', 'medium', 'hard', 'expert', 'easy', 'medium', 'hard']
const DURATIONS = [40, 50, 60, 70, 80, 90, 100, 110, 120]

function scriptToWordScript(s: DailyScript): WordScript {
  if (s === 'cirilica') return 'cirilica'
  if (s === 'latinica-bez-kvacica') return 'easy'
  return 'latinica'
}

export function getDailyTextData(script: DailyScript, today: string) {
  const todayDate = new Date(today)
  const dow = todayDate.getDay() // 0-6

  const scriptIndex = scripts.indexOf(script)
  const baseSeed = dateToSeed(today) + scriptIndex * 7919

  const rng = makeRng(baseSeed)

  const difficulty: TestLevel = DIFFICULTY_BY_DOW[dow]
  const duration = DURATIONS[Math.floor(rng() * DURATIONS.length)]

  const modeIndex = (dateToSeed(today) + scriptIndex) % 2
  const mode: 'reci' | 'tekst' = modeIndex === 0 ? 'reci' : 'tekst'

  const wordScript = scriptToWordScript(script)

  if (mode === 'reci') {
    const words = loadWords(wordScript, difficulty)
    const wordCount = Math.round(45 * (duration / 60)) + 20
    const content = buildWordTest(words, wordCount, difficulty, rng)

    return {
      text_id: null,
      content,
      category: 'reci' as const,
      difficulty,
      duration_seconds: duration,
      mode: 'reci' as const,
    }
  }

  const texts = loadTexts(wordScript, difficulty)
  const rng2 = makeRng(baseSeed + 42)

  const targetWords = Math.round(45 * (duration / 60)) + 15

  const used = new Set<number>()
  const picked: string[] = []
  let wordCount = 0
  while (wordCount < targetWords && used.size < texts.length) {
    const i = Math.floor(rng2() * texts.length)
    if (used.has(i)) continue
    used.add(i)
    picked.push(texts[i])
    wordCount += texts[i].split(/\s+/).length
  }

  const rawContent = picked.length > 0 ? picked.join(' ') : (texts[0] ?? '')
  const content = applyRules(rawContent, difficulty, rng2, true)

  return {
    text_id: null,
    content,
    category: 'recenice' as const,
    difficulty,
    duration_seconds: duration,
    mode: 'tekst' as const,
  }
}
