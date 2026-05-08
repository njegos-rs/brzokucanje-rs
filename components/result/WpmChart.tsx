'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
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
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: number }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-mono shadow-lg">
      <p className="mb-1 text-[var(--muted-foreground)]">{label}s</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export function WpmChart({ data, finalWpm, rawWpm }: Props) {
  const [showRaw, setShowRaw] = useState(true)
  const [showErrors, setShowErrors] = useState(true)

  const accentColor = 'var(--accent)'
  const rawColor = '#737378'
  const errorColor = '#FF6B6B'

  const maxWpm = Math.max(...data.map((d) => Math.max(d.wpm, d.rawWpm)), finalWpm, rawWpm, 10)
  const maxErrors = Math.max(...data.map((d) => d.errors), 1)

  return (
    <div className="w-full">
      {/* Toggle buttons */}
      <div className="mb-3 flex gap-2 justify-end">
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
        <button
          onClick={() => setShowErrors((v) => !v)}
          className={cn(
            'rounded px-2 py-1 text-xs font-mono transition-colors border',
            showErrors
              ? 'border-[var(--border)] text-[var(--incorrect)]'
              : 'border-transparent text-[var(--incorrect)]/40',
          )}
        >
          greške
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
          {showErrors && (
            <YAxis
              yAxisId="errors"
              orientation="right"
              domain={[0, Math.ceil(maxErrors * 1.5)]}
              tick={{ fontSize: 10, fill: errorColor, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          {/* Final WPM referentna linija */}
          <ReferenceLine
            yAxisId="wpm"
            y={finalWpm}
            stroke={accentColor}
            strokeDasharray="4 2"
            strokeOpacity={0.4}
          />
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
          {showErrors && (
            <Line
              yAxisId="errors"
              type="monotone"
              dataKey="errors"
              name="greške"
              stroke={errorColor}
              strokeWidth={1.5}
              dot={{ r: 3, fill: errorColor, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: errorColor }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
