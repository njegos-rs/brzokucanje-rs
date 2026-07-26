import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { containsProfanity, getProfanityListFromDb } from '@/lib/validators/profanity'

type Ctx = { params: Promise<{ id: string }> }

function normalizeNickname(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { user: admin, error } = await requireAdmin()
  if (error) return error

  const { id } = await ctx.params
  let body: { username?: unknown }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Neispravan zahtev' }, { status: 400 })
  }

  const username = normalizeNickname(body.username)

  if (username.length < 3 || username.length > 15) {
    return NextResponse.json({ error: 'Ime mora imati 3-15 karaktera' }, { status: 400 })
  }

  if (!/^[\p{L}\p{N}]+(?: [\p{L}\p{N}]+)?$/u.test(username)) {
    return NextResponse.json({ error: 'Dozvoljeni su slova i brojevi, uz najviše jedan razmak' }, { status: 400 })
  }

  const profanityList = await getProfanityListFromDb()
  if (containsProfanity(username, profanityList)) {
    return NextResponse.json({ error: 'Nedozvoljeno ime' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  const { data: target } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('id', id)
    .maybeSingle()

  if (!target) {
    return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 })
  }

  const { data: taken, error: uniquenessError } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .neq('id', id)
    .limit(1)

  if (uniquenessError) {
    return NextResponse.json({ error: 'Provera imena trenutno nije dostupna' }, { status: 503 })
  }

  if (taken && taken.length > 0) {
    return NextResponse.json({ error: 'Ovo ime je zauzeto' }, { status: 409 })
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ username, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  await supabase.from('admin_actions').insert({
    admin_id: admin!.id,
    action: 'change_username',
    target_type: 'user',
    target_id: id,
    details: { old_username: target.username, new_username: username },
  })

  return NextResponse.json({ success: true, username })
}
