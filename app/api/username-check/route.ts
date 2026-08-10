import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { containsProfanity } from '@/lib/validators/profanity'
import { isValidNickname, normalizeNickname } from '@/lib/validators/nickname'

export async function GET(request: NextRequest) {
  const rawUsername = request.nextUrl.searchParams.get('username')
  const username = rawUsername ? normalizeNickname(rawUsername) : ''

  if (!isValidNickname(username)) {
    return NextResponse.json({ available: false, reason: 'invalid' }, { status: 400 })
  }

  if (containsProfanity(username)) {
    return NextResponse.json({ available: false, reason: 'profanity' })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
  if (!url || url.includes('your-project') || !key || key.includes('...')) {
    return NextResponse.json({ available: false, reason: 'error' }, { status: 503 })
  }

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .limit(1)

  if (error) {
    return NextResponse.json({ available: false, reason: 'error' }, { status: 503 })
  }

  const taken = (data?.length ?? 0) > 0
  return NextResponse.json({ available: !taken, reason: taken ? 'taken' : 'available' })
}
