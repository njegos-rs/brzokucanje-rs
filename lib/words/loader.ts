import type { TestLevel } from '@/lib/typing/engine'

// Statički importi — Turbopack ne podržava dynamic template literal imports
import latLake from './latinica/lake.json'
import latMedium from './latinica/medium.json'
import latHard from './latinica/hard.json'
import latExpert from './latinica/expert.json'

import cyrLake from './cirilica/lake.json'
import cyrMedium from './cirilica/medium.json'
import cyrHard from './cirilica/hard.json'
import cyrExpert from './cirilica/expert.json'

import easyLake from './easy/lake.json'
import easyMedium from './easy/medium.json'
import easyHard from './easy/hard.json'
import easyExpert from './easy/expert.json'

// Tekst mod — smislene rečenice, otežane po levelu
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

type Script = 'latinica' | 'cirilica' | 'easy'

const WORD_MAP: Record<Script, Record<TestLevel, string[]>> = {
  latinica: {
    easy:   latLake as string[],
    medium: latMedium as string[],
    hard:   latHard as string[],
    expert: latExpert as string[],
  },
  cirilica: {
    easy:   cyrLake as string[],
    medium: cyrMedium as string[],
    hard:   cyrHard as string[],
    expert: cyrExpert as string[],
  },
  easy: {
    easy:   easyLake as string[],
    medium: easyMedium as string[],
    hard:   easyHard as string[],
    expert: easyExpert as string[],
  },
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

export function loadWords(script: Script, level: TestLevel): string[] {
  return WORD_MAP[script][level]
}

export function loadTexts(script: Script, level: TestLevel): string[] {
  return TEXT_MAP[script][level]
}

// Globalna seen mapa po sesiji — resetuje se refreshom
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

// Random raspon reči za reci mod — [min, max]
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
