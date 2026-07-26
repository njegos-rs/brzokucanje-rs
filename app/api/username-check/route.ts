import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { containsProfanity } from '@/lib/validators/profanity'

const USERNAME_PATTERN = /^[\p{L}\p{N}]+(?: [\p{L}\p{N}]+)?$/u

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')?.trim().replace(/\s+/g, ' ')

  if (!username || username.length < 3 || username.length > 15 || !USERNAME_PATTERN.test(username)) {
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