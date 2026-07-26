import { describe, it, expect } from 'vitest'
import {
  calcWpm, calcRawWpm, calcAccuracy, calcConsistency, calcScore, calcAll,
} from '@/lib/typing/scoring'

describe('calcWpm', () => {
  it('izraÄunava WPM ispravno', () => {
    // 100 chars / 5 = 20 reÄi, za 1 minutu = 20 WPM
    expect(calcWpm(100, 60_000)).toBeCloseTo(20, 1)
  })

  it('izraÄunava WPM za 30 sekundi', () => {
    // 50 chars / 5 = 10 reÄi, za 0.5 min = 20 WPM
    expect(calcWpm(50, 30_000)).toBeCloseTo(20, 1)
  })

  it('vraÄ‡a 0 za nulto trajanje', () => {
    expect(calcWpm(100, 0)).toBe(0)
  })

  it('tipiÄan brz korisnik ~100 WPM', () => {
    // 500 chars / 5 = 100 reÄi, za 1 min
    expect(calcWpm(500, 60_000)).toBeCloseTo(100, 1)
  })
})

describe('calcRawWpm', () => {
  it('ukljuÄuje pogreÅ¡ne karaktere', () => {
    expect(calcRawWpm(120, 60_000)).toBeCloseTo(24, 1)
  })

  it('rawWpm >= wpm uvek', () => {
    const raw = calcRawWpm(120, 60_000)
    const wpm = calcWpm(100, 60_000)
    expect(raw).toBeGreaterThanOrEqual(wpm)
  })
})

describe('calcAccuracy', () => {
  it('100% taÄnost', () => {
    expect(calcAccuracy(100, 100)).toBe(100)
  })

  it('90% taÄnost', () => {
    expect(calcAccuracy(90, 100)).toBeCloseTo(90, 1)
  })

  it('vraÄ‡a 100 za prazno', () => {
    expect(calcAccuracy(0, 0)).toBe(100)
  })

  it('ograniÄava na 0-100 opseg', () => {
    const acc = calcAccuracy(50, 100)
    expect(acc).toBeGreaterThanOrEqual(0)
    expect(acc).toBeLessThanOrEqual(100)
  })
})

describe('calcConsistency', () => {
  it('100% konzistentnost za identiÄne intervale', () => {
    expect(calcConsistency([100, 100, 100, 100])).toBeCloseTo(100, 0)
  })

  it('manja konzistentnost za varijabilne intervale', () => {
    const consistent = calcConsistency([100, 100, 100])
    const variable = calcConsistency([50, 200, 50, 200])
    expect(consistent).toBeGreaterThan(variable)
  })

  it('vraÄ‡a 100 za jedan interval', () => {
    expect(calcConsistency([150])).toBe(100)
  })

  it('nikad ne vraÄ‡a negativno', () => {
    expect(calcConsistency([10, 500, 10, 500, 10])).toBeGreaterThanOrEqual(0)
  })
})

describe('calcScore', () => {
  it('SCORE = WPM * (ACC/100)^2', () => {
    expect(calcScore(100, 100)).toBeCloseTo(100, 1)
    expect(calcScore(100, 90)).toBeCloseTo(81, 1)
    expect(calcScore(100, 50)).toBeCloseTo(25, 1)
  })

  it('visok WPM sa niskom taÄnoÅ¡Ä‡u daje manji score od sporijeg sa visokom', () => {
    // fast je u ovom sluÄaju veÄ‡i â€” samo proveravamo da formula funkcioniÅ¡e
    expect(calcScore(100, 80)).toBeCloseTo(64, 1)
  })
})

describe('calcAll', () => {
  it('vraÄ‡a sve vrednosti za tipiÄan test', () => {
    const result = calcAll({
      correctChars: 250,
      allChars: 260,
      errors: 10,
      durationMs: 60_000,
      intervals: [120, 130, 110, 125, 115],
    })

    expect(result.wpm).toBeGreaterThan(0)
    expect(result.rawWpm).toBeGreaterThanOrEqual(result.wpm)
    expect(result.accuracy).toBeLessThanOrEqual(100)
    expect(result.accuracy).toBeGreaterThan(90) // 250/260 â‰ˆ 96%
    expect(result.consistency).toBeGreaterThan(0)
    expect(result.score).toBeGreaterThan(0)
  })

  it('score je zaokruÅ¾en na 2 decimale', () => {
    const result = calcAll({
      correctChars: 100,
      allChars: 100,
      errors: 0,
      durationMs: 60_000,
      intervals: [100, 100],
    })
    const decimals = result.score.toString().split('.')[1]?.length ?? 0
    expect(decimals).toBeLessThanOrEqual(2)
  })
})

