import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { containsProfanity, getProfanityListFromDb } from '@/lib/validators/profanity'
import {
  NICKNAME_FORMAT_MESSAGE,
  isValidNickname,
  normalizeNickname as normalizeNicknameValue,
} from '@/lib/validators/nickname'

type Ctx = { params: Promise<{ id: string }> }

function normalizeNickname(value: unknown) {
  return typeof value === 'string' ? normalizeNicknameValue(value) : ''
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await ctx.params
  let body: { username?: unknown }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Neispravan zahtev' }, { status: 400 })
  }

  const username = normalizeNickname(body.username)

  if (!isValidNickname(username)) {
    return NextResponse.json({ error: `Ime mora imati 3–15 karaktera. ${NICKNAME_FORMAT_MESSAGE}.` }, { status: 400 })
  }

  const profanityList = await getProfanityListFromDb()
  if (containsProfanity(username, profanityList)) {
    return NextResponse.json({ error: 'Nedozvoljeno ime' }, { status: 400 })
  }

  const supabase = await createAdminClient()
  const { data: savedUsername, error: updateError } = await supabase.rpc(
    'admin_change_username' as never,
    { p_user_id: id, p_username: username } as never,
  )

  if (updateError) {
    const message = updateError.message || 'Promena username-a nije uspela'
    const status = message.includes('zauzeto') ? 409 : message.includes('pronadjen') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }

  if (savedUsername !== username) {
    return NextResponse.json({ error: 'Baza nije potvrdila promenu username-a' }, { status: 500 })
  }

  return NextResponse.json({ success: true, username: savedUsername })
}
