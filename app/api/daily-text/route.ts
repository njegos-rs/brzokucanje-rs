import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const scripts = ['cirilica', 'latinica', 'latinica-bez-kvacica'] as const
const categories = ['reci', 'recenice', 'citati', 'price', 'vesti'] as const
const levels = ['easy', 'medium', 'hard'] as const

type Script = (typeof scripts)[number]
type Category = (typeof categories)[number]
type Level = (typeof levels)[number]

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

function pickForDay<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const scriptParam = searchParams.get('script') ?? 'latinica'

  if (!isScript(scriptParam)) {
    return NextResponse.json({ error: 'Neispravni parametri' }, { status: 400 })
  }

  const script = scriptParam
  const today = new Date().toISOString().slice(0, 10)

  // Seeded RNG za danas — svi korisnici dobijaju isti izbor
  const rng = seededRandom(dateToSeed(today))
  const category: Category = pickForDay(categories, rng)
  const level: Level = pickForDay(levels, rng)

  const supabase = await createClient()

  // Najpre pokušaj da nađeš u daily_texts tabeli (ručno kuriran sadržaj)
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

    return NextResponse.json({
      text_id: dailyText.text_id,
      content,
      category: pool.category,
      level,
    })
  }

  // Fallback: nasumično iz text_pool po kategoriji i levelu
  const { data: poolTexts, error } = await supabase
    .from('text_pool')
    .select('id, content_lat, content_cyr, content_easy, category')
    .eq('category', category)
    .eq('level', level)
    .limit(100)

  if (error || !poolTexts || poolTexts.length === 0) {
    // Pokušaj bez level filtera
    const { data: fallback } = await supabase
      .from('text_pool')
      .select('id, content_lat, content_cyr, content_easy, category')
      .eq('category', category)
      .limit(100)

    if (!fallback || fallback.length === 0) {
      return NextResponse.json({ error: 'Nema dostupnog teksta za danas' }, { status: 404 })
    }

    const rng2 = seededRandom(dateToSeed(today) + 1)
    const picked = fallback[Math.floor(rng2() * fallback.length)]
    const content = script === 'cirilica'
      ? picked.content_cyr
      : script === 'latinica-bez-kvacica'
        ? picked.content_easy
        : picked.content_lat

    return NextResponse.json({
      text_id: picked.id,
      content,
      category: picked.category,
      level,
    })
  }

  // Seeded izbor teksta iz pool-a
  const rng2 = seededRandom(dateToSeed(today) + 1)
  const picked = poolTexts[Math.floor(rng2() * poolTexts.length)]

  const content = script === 'cirilica'
    ? picked.content_cyr
    : script === 'latinica-bez-kvacica'
      ? picked.content_easy
      : picked.content_lat

  return NextResponse.json({
    text_id: picked.id,
    content,
    category: picked.category,
    level,
  })
}
