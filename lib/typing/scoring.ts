// Scoring je namerno jednostavan: WPM je brzina, score je WPM kaznjen greskama.

export interface ScoringInput {
  correctChars: number
  allChars: number       // uključuje pogrešne
  errors: number
  durationMs: number
  intervals: number[]    // vreme između pritisaka tastera u ms
}

export interface ScoringResult {
  wpm: number
  rawWpm: number
  accuracy: number
  consistency: number
  score: number
}

export function calcWpm(correctChars: number, durationMs: number): number {
  const minutes = durationMs / 1000 / 60
  if (minutes === 0) return 0
  return (correctChars / 5) / minutes
}

export function calcRawWpm(allChars: number, durationMs: number): number {
  const minutes = durationMs / 1000 / 60
  if (minutes === 0) return 0
  return (allChars / 5) / minutes
}

export function calcAccuracy(correctChars: number, allChars: number): number {
  if (allChars === 0) return 100
  return (correctChars / allChars) * 100
}

export function calcConsistency(intervals: number[]): number {
  if (intervals.length < 2) return 100
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length
  if (mean === 0) return 100
  const variance = intervals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / intervals.length
  const stdDev = Math.sqrt(variance)
  const consistency = (1 - stdDev / mean) * 100
  return Math.max(0, Math.min(100, consistency))
}

export function calcScore(wpm: number, accuracy: number): number {
  return wpm * (accuracy / 100) ** 2
}

export function calcTimingStats(intervals: number[]): { stdDev: number; mean: number } {
  if (intervals.length === 0) return { stdDev: 0, mean: 0 }
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length
  const variance = intervals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / intervals.length
  return { stdDev: Math.sqrt(variance), mean }
}

export function calcAll(input: ScoringInput): ScoringResult {
  const wpm = calcWpm(input.correctChars, input.durationMs)
  const rawWpm = calcRawWpm(input.allChars, input.durationMs)
  const accuracy = calcAccuracy(input.correctChars, input.allChars)
  const consistency = calcConsistency(input.intervals)
  const score = calcScore(wpm, accuracy)

  return {
    wpm: Math.round(wpm * 100) / 100,
    rawWpm: Math.round(rawWpm * 100) / 100,
    accuracy: Math.round(accuracy * 100) / 100,
    consistency: Math.round(consistency * 100) / 100,
    score: Math.round(score * 100) / 100,
  }
}
