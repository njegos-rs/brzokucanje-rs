import type { TestLevel } from '@/lib/typing/engine'

import base from './base.json'
import kvacice from './kvacice.json'
import kvaciceMedium from './kvacice-medium.json'
import kvaciceExpert from './kvacice-expert.json'
import medium from './medium.json'
import expert from './expert.json'
import cyrBase from './cyr-base.json'
import cyrMedium from './cyr-medium.json'
import cyrExpert from './cyr-expert.json'
import numbers from './numbers.json'

import latTextEasy from './latinica/text-easy.json'
import latTextMedium from './latinica/text-medium.json'
import latTextHard from './latinica/text-hard.json'
import latTextExpert from './latinica/text-expert.json'
import cyrTextEasy from './cirilica/text-easy.json'
import cyrTextMedium from './cirilica/text-medium.json'
import cyrTextHard from './cirilica/text-hard.json'
import cyrTextExpert from './cirilica/text-expert.json'
import easyTextEasy from './easy/text-easy.json'
import easyTextMedium from './easy/text-medium.json'
import easyTextHard from './easy/text-hard.json'
import easyTextExpert from './easy/text-expert.json'

export type Script = 'latinica' | 'cirilica' | 'easy'

// Meša pool-ove po procentima
function mixPools(...pools: [string[], number][]): string[] {
  const result: string[] = []
  for (const [pool, pct] of pools) {
    const count = Math.round((pool.length * pct) / 100)
    result.push(...pool.slice(0, count))
  }
  return result
}

// Latinica pool-ovi po težini
const LAT_POOLS: Record<TestLevel, string[]> = {
  easy:   mixPools([base as string[], 100]),
  medium: mixPools([base as string[], 50], [kvacice as string[], 50]),
  hard:   mixPools([base as string[], 33], [kvacice as string[], 33], [kvaciceMedium as string[], 34]),
  expert: mixPools([base as string[], 25], [kvacice as string[], 25], [kvaciceMedium as string[], 25], [kvaciceExpert as string[], 25]),
}

// Bez kvačica pool-ovi po težini
const BEZ_POOLS: Record<TestLevel, string[]> = {
  easy:   mixPools([base as string[], 100]),
  medium: mixPools([base as string[], 67], [medium as string[], 33]),
  hard:   mixPools([base as string[], 50], [medium as string[], 25], [expert as string[], 25]),
  expert: mixPools([base as string[], 34], [medium as string[], 33], [expert as string[], 33]),
}

// Ćirilica pool-ovi po težini
const CYR_POOLS: Record<TestLevel, string[]> = {
  easy:   mixPools([cyrBase as string[], 100]),
  medium: mixPools([cyrBase as string[], 67], [cyrMedium as string[], 33]),
  hard:   mixPools([cyrBase as string[], 50], [cyrMedium as string[], 25], [cyrExpert as string[], 25]),
  expert: mixPools([cyrBase as string[], 34], [cyrMedium as string[], 33], [cyrExpert as string[], 33]),
}

const WORD_MAP: Record<Script, Record<TestLevel, string[]>> = {
  latinica: LAT_POOLS,
  easy: BEZ_POOLS,
  cirilica: CYR_POOLS,
}

const TEXT_MAP: Record<Script, Record<TestLevel, string[]>> = {
  latinica: {
    easy:   latTextEasy as string[],
    medium: latTextMedium as string[],
    hard:   latTextHard as string[],
    expert: latTextExpert as string[],
  },
  cirilica: {
    easy:   cyrTextEasy as string[],
    medium: cyrTextMedium as string[],
    hard:   cyrTextHard as string[],
    expert: cyrTextExpert as string[],
  },
  easy: {
    easy:   easyTextEasy as string[],
    medium: easyTextMedium as string[],
    hard:   easyTextHard as string[],
    expert: easyTextExpert as string[],
  },
}

// Base pool za igru — bez rotacije, uvek isti
export const GAME_WORDS: string[] = base as string[]

export function loadWords(script: Script, level: TestLevel): string[] {
  return WORD_MAP[script][level]
}

export function loadTexts(script: Script, level: TestLevel): string[] {
  return TEXT_MAP[script][level]
}

const seenSets: Partial<Record<string, Set<string>>> = {}

function getSeenSet(words: string[]): Set<string> {
  const key = words.slice(0, 4).join('|')
  if (!seenSets[key]) seenSets[key] = new Set()
  return seenSets[key]!
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const WORD_RANGE_BY_LEVEL: Record<TestLevel, [number, number]> = {
  easy:   [15, 60],
  medium: [20, 70],
  hard:   [15, 50],
  expert: [10, 40],
}

export function getRandomWordCount(level: TestLevel): number {
  const [min, max] = WORD_RANGE_BY_LEVEL[level]
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function buildWordTest(words: string[], count: number): string {
  if (words.length === 0) return ''
  const seen = getSeenSet(words)

  let available = words.filter((w) => !seen.has(w))
  if (available.length < count) {
    seen.clear()
    available = [...words]
  }

  const selected = shuffle(available).slice(0, Math.min(count, available.length))
  selected.forEach((w) => seen.add(w))
  return selected.join(' ')
}

export function buildPhraseTest(phrases: string[], count = 5): string {
  if (phrases.length === 0) return ''
  const seen = getSeenSet(phrases)

  let available = phrases.filter((p) => !seen.has(p))
  if (available.length < count) {
    seen.clear()
    available = [...phrases]
  }

  const selected = shuffle(available).slice(0, Math.min(count, available.length))
  selected.forEach((p) => seen.add(p))
  return selected.join(' ')
}

export function resetSeenWords(): void {
  for (const key of Object.keys(seenSets)) delete seenSets[key]
}

export { numbers }
