import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

import { getSiteUrl } from '@/lib/site'

const base = getSiteUrl()

const STATIC_ROUTES = [
  { url: '/', priority: 1.0, changeFrequency: 'daily' },
  { url: '/vezbaj/latinica', priority: 0.9, changeFrequency: 'weekly' },
  { url: '/vezbaj/cirilica', priority: 0.9, changeFrequency: 'weekly' },
  { url: '/vezbaj/easy', priority: 0.8, changeFrequency: 'weekly' },
  { url: '/igra', priority: 0.7, changeFrequency: 'weekly' },
  { url: '/rang-lista/latinica', priority: 0.8, changeFrequency: 'daily' },
  { url: '/rang-lista/cirilica', priority: 0.8, changeFrequency: 'daily' },
  { url: '/rang-lista/easy', priority: 0.7, changeFrequency: 'daily' },
  { url: '/o-nama', priority: 0.7, changeFrequency: 'monthly' },
  { url: '/kako-kucati-brzo', priority: 0.8, changeFrequency: 'weekly' },
  { url: '/politika-privatnosti', priority: 0.3, changeFrequency: 'yearly' },
  { url: '/uslovi-koriscenja', priority: 0.3, changeFrequency: 'yearly' },
] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Empty profiles are low-value URLs. Keep only profiles with a public rank or game result.
  const [rankOwnersResult, gameOwnersResult] = await Promise.all([
    supabase
      .from('scores')
      .select('user_id')
      .eq('mode', 'rank')
      .eq('is_flagged', false)
      .gt('score', 0)
      .limit(10_000),
    supabase
      .from('game_scores')
      .select('user_id')
      .gt('score', 0)
      .limit(10_000),
  ])

  const activeProfileIds = [...new Set([
    ...(rankOwnersResult.data ?? []).map((row) => row.user_id),
    ...(gameOwnersResult.data ?? []).map((row) => row.user_id),
  ])].slice(0, 500)

  const profilesResult = activeProfileIds.length > 0
    ? await supabase
    .from('profiles')
    .select('username, updated_at')
    .in('id', activeProfileIds)
    .eq('is_banned', false)
    .not('username', 'is', null)
    .neq('username', '')
    .order('updated_at', { ascending: false })
    .limit(500)
    : { data: [] }

  const profileUrls: MetadataRoute.Sitemap = (profilesResult.data ?? []).map((p) => ({
    url: `${base}/profil/${encodeURIComponent(p.username!)}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  const staticUrls: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${base}${r.url}`,
    changeFrequency: r.changeFrequency as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: r.priority,
  }))

  return [...staticUrls, ...profileUrls]
}
