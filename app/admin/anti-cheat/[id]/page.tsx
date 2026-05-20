import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { ReviewActions } from './ReviewActions'
import { KeystrokeHistogram } from './KeystrokeHistogram'
import type { KeystrokeEntry } from '@/lib/typing/engine'
import type { Database } from '@/lib/supabase/types'
import { analyzeKeystrokes } from '@/lib/typing/anti-cheat'

type ScoreRow = Database['public']['Tables']['scores']['Row']

export const metadata: Metadata = { title: 'Admin — Anti-cheat pregled' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function AntiCheatDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data } = await supabase
    .from('scores')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', data.user_id)
    .maybeSingle()

  const score: ScoreRow & { profiles: { username: string | null } | null } = {
    ...data,
    profiles: profile,
  }

  const keystrokes = Array.isArray(score.keystroke_log)
    ? (score.keystroke_log as unknown as KeystrokeEntry[])
    : []

  const analysis = analyzeKeystrokes(keystrokes, score.wpm)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)]">Anti-cheat pregled</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {score.profiles?.username ?? 'Nepoznat'} · {score.script} · {score.category} · {new Date(score.created_at).toLocaleString('sr-RS')}
        </p>
      </div>

      {/* Score info */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'WPM', value: Math.round(score.wpm) },
          { label: 'Raw WPM', value: Math.round(score.raw_wpm) },
          { label: 'Tačnost', value: `${Math.round(score.accuracy)}%` },
          { label: 'Trajanje', value: `${score.duration_seconds}s` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-[var(--foreground)]">{value}</p>
          </div>
        ))}
      </div>

      {/* Flag razlog */}
      <div className="rounded-lg border border-[var(--incorrect)]/30 bg-[var(--incorrect)]/10 px-4 py-3">
        <p className="text-sm font-medium text-[var(--incorrect)]">Razlog flaga: {score.flag_reason ?? '—'}</p>
      </div>

      {/* Anti-cheat analiza */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Analiza keystroke-ova</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">Prosečni interval</p>
            <p className="font-mono font-bold">{analysis.avgInterval} ms</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">Std. devijacija</p>
            <p className="font-mono font-bold">{analysis.stdDev} ms</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">Uzan raspon</p>
            <p className="font-mono font-bold">{Math.round(analysis.narrowBandRatio * 100)}%</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">Identični intervali</p>
            <p className={`font-mono font-bold ${analysis.identicalIntervals ? 'text-[var(--incorrect)]' : 'text-[var(--correct)]'}`}>
              {analysis.identicalIntervals ? 'DA' : 'NE'}
            </p>
          </div>
        </div>

        {keystrokes.length > 0 && (
          <div className="mt-4">
            <KeystrokeHistogram keystrokes={keystrokes} />
          </div>
        )}
      </div>

      {/* Review akcije */}
      <ReviewActions
        scoreId={id}
        userId={score.user_id}
        username={score.profiles?.username ?? 'Nepoznat'}
        isReviewed={(score as any).flag_reviewed ?? false}
        decision={(score as any).review_decision}
      />
    </div>
  )
}
