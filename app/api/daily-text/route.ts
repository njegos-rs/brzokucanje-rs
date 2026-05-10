import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const scripts = ['cirilica', 'latinica', 'latinica-bez-kvacica'] as const
const categories = ['recenice', 'citati', 'price'] as const
const difficulties = ['lake', 'srednje', 'teske'] as const

type Script = (typeof scripts)[number]

function isScript(value: string): value is Script {
  return scripts.includes(value as Script)
}

// Deterministički PRNG baziran na datumu — isti rezultat za sve korisnike istog dana
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function dateToSeed(dateStr: string): number {
  return dateStr.split('-').reduce((acc, part) => acc * 1000 + parseInt(part), 0)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const scriptParam = searchParams.get('script') ?? 'latinica'

  if (!isScript(scriptParam)) {
    return NextResponse.json({ error: 'Neispravni parametri' }, { status: 400 })
  }

  const script = scriptParam
  const today = new Date().toISOString().slice(0, 10)
  const supabase = await createClient()

  // 1. Pokušaj iz daily_texts (ručno kuriran sadržaj)
  const { data: dailyText } = await supabase
    .from('daily_texts')
    .select('text_id, text_pool(content_lat, content_cyr, content_easy, category)')
    .eq('date', today)
    .eq('script', script)
    .maybeSingle()

  if (dailyText?.text_pool) {
    const pool = dailyText.text_pool as {
      content_lat: string
      content_cyr: string
      content_easy: string
      category: string
    }
    const content = script === 'cirilica'
      ? pool.content_cyr
      : script === 'latinica-bez-kvacica'
        ? pool.content_easy
        : pool.content_lat

    return NextResponse.json({ text_id: dailyText.text_id, content, category: pool.category })
  }

  // 2. Seeded RNG: odaberi kategoriju i težinu za danas
  const rng = seededRandom(dateToSeed(today))
  const category = categories[Math.floor(rng() * categories.length)]
  const difficulty = difficulties[Math.floor(rng() * difficulties.length)]

  // 3. Uzmi tekstove po kategoriji i težini
  const { data: pool } = await supabase
    .from('text_pool')
    .select('id, content_lat, content_cyr, content_easy, category')
    .eq('category', category)
    .eq('difficulty', difficulty)
    .eq('is_active', true)
    .limit(100)

  // 4. Fallback: samo kategorija bez težine
  const texts = (pool && pool.length > 0) ? pool : await supabase
    .from('text_pool')
    .select('id, content_lat, content_cyr, content_easy, category')
    .eq('category', category)
    .eq('is_active', true)
    .limit(100)
    .then(r => r.data ?? [])

  // 5. Fallback: bilo koji aktivan tekst
  const finalTexts = texts.length > 0 ? texts : await supabase
    .from('text_pool')
    .select('id, content_lat, content_cyr, content_easy, category')
    .eq('is_active', true)
    .limit(100)
    .then(r => r.data ?? [])

  if (finalTexts.length === 0) {
    return NextResponse.json({ error: 'Nema dostupnog teksta za danas' }, { status: 404 })
  }

  // Seeded izbor konkretnog teksta
  const rng2 = seededRandom(dateToSeed(today) + 999)
  const picked = finalTexts[Math.floor(rng2() * finalTexts.length)]

  const content = script === 'cirilica'
    ? picked.content_cyr
    : script === 'latinica-bez-kvacica'
      ? picked.content_easy
      : picked.content_lat

  return NextResponse.json({ text_id: picked.id, content, category: picked.category })
}
