import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { containsProfanity, getProfanityListFromDb } from '@/lib/validators/profanity'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')

  if (!username || username.length < 3) {
    return NextResponse.json({ available: false, reason: 'too_short' })
  }

  const profanityList = await getProfanityListFromDb()
  if (containsProfanity(username, profanityList)) {
    return NextResponse.json({ available: false, reason: 'profanity' })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ available: false, reason: 'error' }, { status: 500 })
  }

  return NextResponse.json({ available: data === null })
}
