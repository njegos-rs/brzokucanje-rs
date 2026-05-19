'use client'

import { useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { WpmSnapshot } from '@/lib/typing/engine'
import { cn } from '@/lib/utils'

interface Props {
  data: WpmSnapshot[]
  finalWpm: number
  rawWpm: number
}

interface TooltipPayload {
  name: string
  value: number
  color: string
  payload?: WpmSnapshot
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: number }) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload

  return (
    <div className="rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-mono shadow-lg">
      <p className="mb-1 text-[var(--muted-foreground)]">{label}s</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
      {point && <p className="mt-1 text-[var(--incorrect)]">greske ukupno: {point.errors}</p>}
    </div>
  )
}

export function WpmChart({ data, finalWpm, rawWpm }: Props) {
  const [showRaw, setShowRaw] = useState(true)

  const accentColor = 'var(--accent)'
  const rawColor = '#737378'
  const maxWpm = Math.max(...data.map((d) => Math.max(d.wpm, d.rawWpm)), finalWpm, rawWpm, 10)
  const totalErrors = data.at(-1)?.errors ?? 0

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">Brzina kroz test</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Linija pokazuje WPM po sekundama. Greske su prikazane odvojeno, bez druge skale.
          </p>
        </div>
        <button
          onClick={() => setShowRaw((v) => !v)}
          className={cn(
            'rounded px-2 py-1 text-xs font-mono transition-colors border',
            showRaw
              ? 'border-[var(--border)] text-[var(--muted-foreground)]'
              : 'border-transparent text-[var(--muted-foreground)]/40',
          )}
        >
          raw
        </button>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="second"
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}
            tickFormatter={(v) => `${v}s`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="wpm"
            domain={[0, Math.ceil(maxWpm * 1.15)]}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine yAxisId="wpm" y={finalWpm} stroke={accentColor} strokeDasharray="4 2" strokeOpacity={0.4} />
          <Line
            yAxisId="wpm"
            type="monotone"
            dataKey="wpm"
            name="wpm"
            stroke={accentColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: accentColor }}
          />
          {showRaw && (
            <Line
              yAxisId="wpm"
              type="monotone"
              dataKey="rawWpm"
              name="raw"
              stroke={rawColor}
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              activeDot={{ r: 3, fill: rawColor }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
        <span>
          <span className="font-mono text-[var(--accent)]">{finalWpm}</span> finalni WPM
        </span>
        <span>
          <span className="font-mono text-[var(--foreground)]">{totalErrors}</span> gresaka tokom testa
        </span>
      </div>
    </div>
  )
}
