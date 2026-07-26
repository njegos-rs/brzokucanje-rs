import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

function cleanString(value: unknown, max: number) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

export async function POST(req: Request) {
  let body: { path?: unknown; visitorId?: unknown; referrer?: unknown }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const path = cleanString(body.path, 500)
  if (!path || !path.startsWith('/') || path.startsWith('/admin') || path.startsWith('/api')) {
    return NextResponse.json({ ok: true })
  }

  const visitorId = cleanString(body.visitorId, 120)
  const referrer = cleanString(body.referrer, 500)
  const userAgent = cleanString(req.headers.get('user-agent'), 500)

  try {
    const supabase = await createClient()
    const serviceSupabase = await createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()

    await serviceSupabase.from('site_visits').insert({
      path,
      visitor_id: visitorId,
      user_id: user?.id ?? null,
      referrer,
      user_agent: userAgent,
    })
  } catch {
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}
