'use client'

interface Props {
  wpm: number
  accuracy: number
  errors: number
}

export function LiveStats({ wpm, accuracy, errors }: Props) {
  return (
    <div className="flex items-center gap-8 font-mono">
      <div className="text-center">
        <p className="text-3xl font-bold text-[var(--accent)]">{Math.round(wpm)}</p>
        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">wpm</p>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold text-[var(--foreground)]">{Math.round(accuracy)}%</p>
        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">tačnost</p>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold text-[var(--incorrect)]">{errors}</p>
        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">greške</p>
      </div>
    </div>
  )
}
