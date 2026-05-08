'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  script: string
  category: string
}

interface WidgetData {
  myRank: number | null
  totalToday: number
}

export function RankingWidget({ script, category }: Props) {
  const [data, setData] = useState<WidgetData>({ myRank: null, totalToday: 0 })
  const [prev, setPrev] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/leaderboard?script=${script}&category=${category}&period=daily&limit=100`)
      if (!res.ok) return
      const json = await res.json()
      const entries = (json.data ?? []) as { user_id?: string; daily_rank?: number }[]

      // getCurrentUser
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const mine = entries.find((e) => e.user_id === user.id)
      const myRank = mine?.daily_rank ?? null

      if (myRank !== prev && prev !== null) {
        setFlash(true)
        setTimeout(() => setFlash(false), 800)
      }
      setPrev(myRank)
      setData({ myRank, totalToday: entries.length })
    } catch {
      // silently ignore
    }
  }, [script, category, prev])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 10000)
    return () => clearInterval(interval)
  }, [refresh])

  if (data.totalToday === 0) return null

  const isTop10 = data.myRank !== null && data.myRank <= 10

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-all',
        flash && 'scale-105',
        isTop10
          ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]'
          : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)]',
      )}
    >
      <TrendingUp className="h-3.5 w-3.5" />
      {data.myRank !== null ? (
        <span>
          #{data.myRank} od {data.totalToday} danas
        </span>
      ) : (
        <span>{data.totalToday} učesnika danas</span>
      )}
    </div>
  )
}
