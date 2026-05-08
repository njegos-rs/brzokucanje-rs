import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const scripts = ['cirilica', 'latinica', 'easy'] as const
const categories = ['reci', 'recenice', 'citati', 'price', 'vesti'] as const

type Script = (typeof scripts)[number]
type Category = (typeof categories)[number]

function isScript(value: string): value is Script {
  return scripts.includes(value as Script)
}

function isCategory(value: string): value is Category {
  return categories.includes(value as Category)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const scriptParam = searchParams.get('script') ?? 'latinica'
  const categoryParam = searchParams.get('category') ?? 'reci'

  if (!isScript(scriptParam) || !isCategory(categoryParam)) {
    return NextResponse.json({ error: 'Neispravni parametri' }, { status: 400 })
  }

  const script = scriptParam
  const category = categoryParam

  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: dailyText, error: dtError } = await supabase
    .from('daily_texts')
    .select('text_id, text_pool(content_lat, content_cyr, content_easy, category)')
    .eq('date', today)
    .eq('script', script)
    .eq('category', category)
    .single()

  if (dtError || !dailyText) {
    return NextResponse.json({ error: 'Nema dnevnog teksta za danas' }, { status: 404 })
  }

  const pool = dailyText.text_pool as {
    content_lat: string
    content_cyr: string
    content_easy: string
    category: string
  } | null

  if (!pool) {
    return NextResponse.json({ error: 'Tekst nije pronađen' }, { status: 404 })
  }

  const content = script === 'cirilica'
    ? pool.content_cyr
    : script === 'easy'
      ? pool.content_easy
      : pool.content_lat

  return NextResponse.json({
    text_id: dailyText.text_id,
    content,
    category: pool.category,
  })
}
