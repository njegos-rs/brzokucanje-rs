import { NextRequest, NextResponse } from 'next/server'
import { loadTexts, loadWords } from '@/lib/words/loader'
import type { TestLevel } from '@/lib/typing/engine'

type Script = 'latinica' | 'cirilica' | 'easy'
type Kind = 'words' | 'texts'
const scripts: Script[] = ['latinica', 'cirilica', 'easy']
const levels: TestLevel[] = ['easy', 'medium', 'hard', 'expert']
const kinds: Kind[] = ['words', 'texts']

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const script = params.get('script') as Script | null
  const level = params.get('level') as TestLevel | null
  const kind = params.get('kind') as Kind | null

  if (!script || !scripts.includes(script) || !level || !levels.includes(level) || !kind || !kinds.includes(kind)) {
    return NextResponse.json({ error: 'Neispravni parametri.' }, { status: 400 })
  }

  const values = kind === 'words' ? loadWords(script, level) : loadTexts(script, level)
  return NextResponse.json({ values }, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
