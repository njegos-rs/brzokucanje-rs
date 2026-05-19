import type { TestLevel } from '@/lib/typing/engine'
import { makeRng } from '@/lib/prng'

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
import gamePool from './game-pool.json'

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
import easyLake from './easy/lake.json'

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
  easy:   mixPools([easyLake as string[], 70], [kvacice as string[], 30]),
  medium: mixPools([base as string[], 50], [kvacice as string[], 50]),
  hard:   mixPools([base as string[], 33], [kvacice as string[], 33], [kvaciceMedium as string[], 34]),
  expert: mixPools([base as string[], 25], [kvacice as string[], 25], [kvaciceMedium as string[], 25], [kvaciceExpert as string[], 25]),
}

// Bez kvačica pool-ovi po težini
const BEZ_POOLS: Record<TestLevel, string[]> = {
  easy:   mixPools([easyLake as string[], 100]),
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

// Namenski pool za igru, odvojen od vežbaj/rank pool-ova.
export const GAME_WORDS: string[] = gamePool as string[]

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

function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
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

export function applyRules(text: string, level: TestLevel, rng: () => number, isTextMode: boolean): string {
  if (level === 'easy') {
    // Easy: Samo obične reči/tekst. Bez velikih slova, bez interpunkcije, bez ikakvih znakova.
    let clean = text.toLowerCase()
    clean = clean.replace(/[^\p{L}\s]/gu, '').replace(/\s+/g, ' ').trim()
    return clean
  }

  if (level === 'medium') {
    // Medium: Velika početna slova. Interpunkcija (tačka, zarez...). Vlastite imenice.
    if (isTextMode) {
      return text
    } else {
      return text.split(' ').map(w => {
        let res = w
        if (rng() < 0.25) res = res[0].toUpperCase() + res.slice(1)
        const r = rng()
        if (r < 0.1) res += ','
        else if (r < 0.15) res += '.'
        return res
      }).join(' ')
    }
  }

  if (level === 'hard') {
    // Hard: Medium + brojevi + znakovi. Velika slova nasred reči.
    return text.split(' ').map(w => {
      let res = w
      if (rng() < 0.15 && res.length > 2) {
        const p = 1 + Math.floor(rng() * (res.length - 2))
        res = res.slice(0, p) + res[p].toUpperCase() + res.slice(p + 1)
      } else if (!isTextMode && rng() < 0.25) {
        res = res[0].toUpperCase() + res.slice(1)
      }

      const r = rng()
      if (r < 0.05) res = `${Math.floor(rng() * 100)}${res}`
      else if (r < 0.1) res = `"${res}"`
      else if (r < 0.15) res = `(${res})`
      else if (r < 0.2) res = `${res}-`
      else if (r < 0.25) res = `${res}_${Math.floor(rng() * 10)}`
      else if (r < 0.3) res = `${res}%`
      else if (r < 0.35) res = `${res}!`
      else if (r < 0.4) res = `${res}?`
      
      return res
    }).join(' ')
  }

  // Expert: Svi znakovi na tastaturi (umereno). Leetspeak. Haotično.
  const leet: Record<string, string> = {
    'o': '0', 'O': '0', 'о': '0', 'О': '0',
    'a': '@', 'A': '@', 'а': '@', 'А': '@',
    'e': '3', 'E': '3', 'е': '3', 'Е': '3',
    'i': '1', 'I': '1', 'и': '1', 'И': '1'
  }
  return text.split(' ').map(w => {
    let res = w.split('').map(c => {
      if (leet[c] && rng() < 0.35) return leet[c]
      if (rng() < 0.15) return c.toUpperCase()
      return c
    }).join('')

    const r = rng()
    if (r < 0.05) res = `<${res}>`
    else if (r < 0.1) res = `[${res}]`
    else if (r < 0.15) res = `{${res}}`
    else if (r < 0.2) res = `#${res}`
    else if (r < 0.25) res = `${res}*`
    else if (r < 0.3) res = `~${res}`
    else if (r < 0.35) res = `${res}+`
    else if (r < 0.4) res = `${res}=`
    else if (r < 0.45) res = `\\${res}/`

    return res
  }).join(' ')
}

export function buildWordTest(words: string[], count: number, level: TestLevel = 'easy', seedRng?: () => number): string {
  if (words.length === 0) return ''
  
  let available = seedRng ? [...words] : words.filter((w) => !getSeenSet(words).has(w))
  
  if (available.length < count) {
    if (!seedRng) getSeenSet(words).clear()
    available = [...words]
  }

  const selected = shuffle(available, seedRng).slice(0, Math.min(count, available.length))
  if (!seedRng) selected.forEach((w) => getSeenSet(words).add(w))

  const transRng = seedRng ?? makeRng(Date.now())
  return applyRules(selected.join(' '), level, transRng, false)
}

export function buildPhraseTest(phrases: string[], count: number = 5, level: TestLevel = 'easy', seedRng?: () => number): string {
  if (phrases.length === 0) return ''
  
  let available = seedRng ? [...phrases] : phrases.filter((p) => !getSeenSet(phrases).has(p))
  
  if (available.length < count) {
    if (!seedRng) getSeenSet(phrases).clear()
    available = [...phrases]
  }

  const selected = shuffle(available, seedRng).slice(0, Math.min(count, available.length))
  if (!seedRng) selected.forEach((p) => getSeenSet(phrases).add(p))
  
  const transRng = seedRng ?? makeRng(Date.now())
  return applyRules(selected.join(' '), level, transRng, true)
}

export function resetSeenWords(): void {
  for (const key of Object.keys(seenSets)) delete seenSets[key]
}

export { numbers }
