import type { KeystrokeEntry } from './engine'

export interface AntiCheatResult {
  passed: boolean
  flags: string[]
  stdDev: number
  avgInterval: number
  identicalIntervals: boolean
  narrowBandRatio: number
}

function stdDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

export function analyzeKeystrokes(
  keystrokes: KeystrokeEntry[],
  wpm: number,
): AntiCheatResult {
  const flags: string[] = []

  // Filtriramo samo insert akcije sa timestamp-ovima
  const insertKs = keystrokes.filter((k) => k.action === 'correct' || k.action === 'incorrect')
  if (insertKs.length < 10) {
    return { passed: true, flags: [], stdDev: 0, avgInterval: 0, identicalIntervals: false, narrowBandRatio: 0 }
  }

  // Intervali između uzastopnih keystroke-ova (ms)
  const intervals: number[] = []
  for (let i = 1; i < insertKs.length; i++) {
    const diff = insertKs[i].ts - insertKs[i - 1].ts
    if (diff > 0 && diff < 2000) {
      intervals.push(diff)
    }
  }

  if (intervals.length < 5) {
    return { passed: true, flags: [], stdDev: 0, avgInterval: 0, identicalIntervals: false, narrowBandRatio: 0 }
  }

  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
  const sd = stdDeviation(intervals)

  // Proveri identične intervale
  const uniqueIntervals = new Set(intervals)
  const identicalIntervals = uniqueIntervals.size <= 2

  // Proveri uzan raspon (>90% intervala unutar ±5ms od prosjeka)
  const narrowCount = intervals.filter((v) => Math.abs(v - avg) <= 5).length
  const narrowBandRatio = narrowCount / intervals.length

  // Sloj 2 pravila
  if (identicalIntervals && avg < 50) {
    flags.push('BOT_IDENTICAL_INTERVALS')
  }
  if (sd < 8 && avg < 50) {
    flags.push('BOT_LOW_STDDEV')
  }
  if (narrowBandRatio > 0.9 && avg < 80) {
    flags.push('BOT_NARROW_BAND')
  }
  if (wpm > 220) {
    flags.push('WPM_EXCEEDED_MAX')
  }

  return {
    passed: flags.length === 0,
    flags,
    stdDev: Math.round(sd * 10) / 10,
    avgInterval: Math.round(avg),
    identicalIntervals,
    narrowBandRatio: Math.round(narrowBandRatio * 100) / 100,
  }
}

// Sloj 3: server-side pravila (čist unos bez DOM zavisnosti)
export function serverSideCheck(wpm: number, accuracy: number): string[] {
  const flags: string[] = []
  if (wpm > 220) flags.push('WPM_EXCEEDED_MAX')
  if (accuracy >= 99 && wpm >= 130) flags.push('SUSPICIOUS_PERFECT_SCORE')
  return flags
}
