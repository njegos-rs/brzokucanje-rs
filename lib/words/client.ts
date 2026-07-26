import type { TestLevel } from '@/lib/typing/engine'

export type ClientScript = 'latinica' | 'cirilica' | 'easy'
export type PoolKind = 'words' | 'texts'

export async function fetchWordPool(
  script: ClientScript,
  level: TestLevel,
  kind: PoolKind,
  signal?: AbortSignal,
): Promise<string[]> {
  const params = new URLSearchParams({ script, level, kind })
  const response = await fetch(`/api/word-pool?${params.toString()}`, {
    signal,
    cache: 'force-cache',
  })
  if (!response.ok) throw new Error('Word pool nije dostupan.')
  const data = (await response.json()) as { values?: unknown }
  return Array.isArray(data.values) ? data.values.filter((value): value is string => typeof value === 'string') : []
}
