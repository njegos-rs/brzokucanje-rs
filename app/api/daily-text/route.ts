import { NextRequest, NextResponse } from 'next/server'
import { getDailyTextData, type DailyScript } from '@/lib/words/daily'
import { getCurrentDateInAppTimeZone } from '@/lib/date'

const scripts = ['cirilica', 'latinica', 'latinica-bez-kvacica'] as const

function isScript(value: string): value is DailyScript {
  return scripts.includes(value as DailyScript)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const scriptParam = searchParams.get('script') ?? 'latinica'

  if (!isScript(scriptParam)) {
    return NextResponse.json({ error: 'Neispravni parametri' }, { status: 400 })
  }

  const today = getCurrentDateInAppTimeZone()
  const data = getDailyTextData(scriptParam, today)

  return NextResponse.json(data)
}
