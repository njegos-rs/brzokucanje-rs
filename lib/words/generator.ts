import type { TestLevel } from '@/lib/typing/engine'
import { makeRng } from '@/lib/prng'

const seenSets: Partial<Record<string, Set<string>>> = {}

function getSeenSet(values: string[]): Set<string> {
  const key = values.slice(0, 4).join('|')
  if (!seenSets[key]) seenSets[key] = new Set()
  return seenSets[key]!
}

function shuffle<T>(values: T[], rng: () => number = Math.random): T[] {
  const result = [...values]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const WORD_RANGE_BY_LEVEL: Record<TestLevel, [number, number]> = {
  easy: [15, 60], medium: [20, 70], hard: [15, 50], expert: [10, 40],
}

export function getRandomWordCount(level: TestLevel): number {
  const [min, max] = WORD_RANGE_BY_LEVEL[level]
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function applyRules(text: string, level: TestLevel, rng: () => number, isTextMode: boolean): string {
  if (level === 'easy') {
    return text.toLowerCase().replace(/[^\p{L}\s]/gu, '').replace(/\s+/g, ' ').trim()
  }

  if (level === 'medium') {
    if (isTextMode) return text
    return text.split(' ').map((word) => {
      let result = word
      if (rng() < 0.25) result = result[0].toUpperCase() + result.slice(1)
      const marker = rng()
      if (marker < 0.1) result += ','
      else if (marker < 0.15) result += '.'
      return result
    }).join(' ')
  }

  if (level === 'hard') {
    return text.split(' ').map((word) => {
      let result = word
      if (rng() < 0.15 && result.length > 2) {
        const index = 1 + Math.floor(rng() * (result.length - 2))
        result = result.slice(0, index) + result[index].toUpperCase() + result.slice(index + 1)
      } else if (!isTextMode && rng() < 0.25) {
        result = result[0].toUpperCase() + result.slice(1)
      }
      const marker = rng()
      if (marker < 0.05) result = `${Math.floor(rng() * 100)}${result}`
      else if (marker < 0.1) result = `"${result}"`
      else if (marker < 0.15) result = `(${result})`
      else if (marker < 0.2) result = `${result}-`
      else if (marker < 0.25) result = `${result}_${Math.floor(rng() * 10)}`
      else if (marker < 0.3) result = `${result}%`
      else if (marker < 0.35) result = `${result}!`
      else if (marker < 0.4) result = `${result}?`
      return result
    }).join(' ')
  }

  const leet: Record<string, string> = {
    o: '0', O: '0', '\u043e': '0', '\u041e': '0',
    a: '@', A: '@', '\u0430': '@', '\u0410': '@',
    e: '3', E: '3', '\u0435': '3', '\u0415': '3',
    i: '1', I: '1', '\u0438': '1', '\u0418': '1',
  }
  return text.split(' ').map((word) => {
    let result = word.split('').map((char) => {
      if (leet[char] && rng() < 0.35) return leet[char]
      if (rng() < 0.15) return char.toUpperCase()
      return char
    }).join('')
    const marker = rng()
    if (marker < 0.05) result = `<${result}>`
    else if (marker < 0.1) result = `[${result}]`
    else if (marker < 0.15) result = `{${result}}`
    else if (marker < 0.2) result = `#${result}`
    else if (marker < 0.25) result = `${result}*`
    else if (marker < 0.3) result = `~${result}`
    else if (marker < 0.35) result = `${result}+`
    else if (marker < 0.4) result = `${result}=`
    else if (marker < 0.45) result = `\\${result}/`
    return result
  }).join(' ')
}

export function buildWordTest(words: string[], count: number, level: TestLevel = 'easy', seedRng?: () => number): string {
  if (words.length === 0) return ''
  let available = seedRng ? [...words] : words.filter((word) => !getSeenSet(words).has(word))
  if (available.length < count) {
    if (!seedRng) getSeenSet(words).clear()
    available = [...words]
  }
  const selected = shuffle(available, seedRng).slice(0, Math.min(count, available.length))
  if (!seedRng) selected.forEach((word) => getSeenSet(words).add(word))
  return applyRules(selected.join(' '), level, seedRng ?? makeRng(Date.now()), false)
}

export function buildPhraseTest(phrases: string[], count = 5, level: TestLevel = 'easy', seedRng?: () => number): string {
  if (phrases.length === 0) return ''
  let available = seedRng ? [...phrases] : phrases.filter((phrase) => !getSeenSet(phrases).has(phrase))
  if (available.length < count) {
    if (!seedRng) getSeenSet(phrases).clear()
    available = [...phrases]
  }
  const selected = shuffle(available, seedRng).slice(0, Math.min(count, available.length))
  if (!seedRng) selected.forEach((phrase) => getSeenSet(phrases).add(phrase))
  return applyRules(selected.join(' '), level, seedRng ?? makeRng(Date.now()), true)
}

export function resetSeenWords(): void {
  Object.keys(seenSets).forEach((key) => delete seenSets[key])
}
