'use client'

import { LeaderboardPanel, type LeaderboardScript } from '@/components/rank/LeaderboardPanel'

interface Props {
  script: LeaderboardScript
}

export function LeaderboardContent({ script }: Props) {
  return (
    <LeaderboardPanel
      script={script}
      navigationBase="/rang-lista"
      showScriptTabs
      titlePrefix="rank lista"
    />
  )
}
