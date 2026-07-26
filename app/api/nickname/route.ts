import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { containsProfanity, getProfanityListFromDb } from '@/lib/validators/profanity'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  let { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const { data: anonData } = await supabase.auth.signInAnonymously()
    user = anonData?.user ?? null
  }

  if (!user) {
    return NextResponse.json({ error: 'Nije moguće kreirati sesiju' }, { status: 401 })
  }

  let body: { nickname?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Neispravan zahtev' }, { status: 400 })
  }

  const nickname = body.nickname?.trim().replace(/\s+/g, ' ')

  if (!nickname) {
    return NextResponse.json({ error: 'Ime je obavezno' }, { status: 400 })
  }

  // Validacija formata
  if (nickname.length < 3 || nickname.length > 15) {
    return NextResponse.json({ error: 'Ime mora imati 3-15 karaktera' }, { status: 400 })
  }

  if (!/^[\p{L}\p{N}]+(?: [\p{L}\p{N}]+)?$/u.test(nickname)) {
    return NextResponse.json({ error: 'Dozvoljeni su slova i brojevi, uz najviše jedan razmak' }, { status: 400 })
  }

  // Proveri da li korisnik već ima nickname
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle()

  if (existingProfile?.username) {
    return NextResponse.json({ error: 'Već imaš postavljeno ime' }, { status: 409 })
  }

  // Profanity provera
  const profanityList = await getProfanityListFromDb()
  if (containsProfanity(nickname, profanityList)) {
    return NextResponse.json({ error: 'Nedozvoljeno ime' }, { status: 400 })
  }

  // Proveri jedinstvenost
  const serviceSupabase = await createServiceClient()
  const { data: taken, error: uniquenessError } = await serviceSupabase
    .from('profiles')
    .select('id')
    .ilike('username', nickname)
    .limit(1)

  if (uniquenessError) {
    return NextResponse.json({ error: 'Provera imena trenutno nije dostupna' }, { status: 503 })
  }

  if (taken && taken.length > 0) {
    return NextResponse.json({ error: 'Ovo ime je zauzeto' }, { status: 409 })
  }

  // Profil nastaje tek kada je ime uspešno potvrđeno.
  const { error } = await serviceSupabase
    .from('profiles')
    .upsert(
      { id: user.id, username: nickname, is_anonymous: false },
      { onConflict: 'id' },
    )

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return NextResponse.json({ error: 'Ovo ime je zauzeto' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, nickname })
}
