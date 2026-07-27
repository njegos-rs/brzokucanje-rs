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
  { url: '/prijava', priority: 0.5, changeFrequency: 'monthly' },
  { url: '/o-nama', priority: 0.7, changeFrequency: 'monthly' },
  { url: '/kako-kucati-brzo', priority: 0.8, changeFrequency: 'weekly' },
] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('username, updated_at')
    .not('username', 'is', null)
    .neq('username', '')
    .order('updated_at', { ascending: false })
    .limit(500)

  const profileUrls: MetadataRoute.Sitemap = (profiles ?? []).map((p) => ({
    url: `${base}/profil/${p.username}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  const staticUrls: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${base}${r.url}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: r.priority,
  }))

  return [...staticUrls, ...profileUrls]
}
