'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { KeystrokeEntry } from '@/lib/typing/engine'

interface Props {
  keystrokes: KeystrokeEntry[]
}

export function KeystrokeHistogram({ keystrokes }: Props) {
  const data = useMemo(() => {
    const inserts = keystrokes.filter((k) => k.action === 'correct' || k.action === 'incorrect')
    const intervals: number[] = []
    for (let i = 1; i < inserts.length; i++) {
      const diff = inserts[i].ts - inserts[i - 1].ts
      if (diff > 0 && diff < 1000) intervals.push(Math.round(diff / 10) * 10)
    }

    const counts: Record<number, number> = {}
    for (const v of intervals) {
      counts[v] = (counts[v] ?? 0) + 1
    }

    return Object.entries(counts)
      .map(([ms, count]) => ({ ms: Number(ms), count }))
      .sort((a, b) => a.ms - b.ms)
      .slice(0, 40)
  }, [keystrokes])

  if (data.length === 0) return null

  return (
    <div>
      <p className="mb-2 text-xs text-[var(--muted-foreground)]">Distribucija intervala između keystroke-ova (ms)</p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <XAxis dataKey="ms" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
          <Tooltip
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', fontSize: 12 }}
            formatter={(v) => [v as number, 'keystroke-ovi']}
            labelFormatter={(l) => `${l}ms`}
          />
          <Bar dataKey="count" fill="var(--accent)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
