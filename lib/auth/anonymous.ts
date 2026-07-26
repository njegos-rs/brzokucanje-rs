'use client'

import { createClient } from '@/lib/supabase/client'

const DEVICE_ID_KEY = 'brzokucanje_device_id'

/**
 * Generiše ili vraća postojeći device_id iz localStorage.
 * Služi kao backup identifikator za anonimne korisnike.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return ''
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

/**
 * Proverava da li postoji Supabase sesija.
 * Ako ne postoji — kreira anonimnog korisnika i čuva device_id u profilu.
 * 
 * Poziva se jednom pri učitavanju stranice (u Header komponenti).
 */
export async function ensureAnonymousSession(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!url || url.includes('placeholder') || url.includes('your-project')) {
    return
  }

  try {
    const supabase = createClient()

    const userRes = await supabase.auth.getUser().catch(() => ({ data: { user: null }, error: null }))
    const user = userRes.data?.user

    if (user) {
      // Sesija postoji — ništa ne radi
      return
    }

    // Nema sesije — kreiraj anonimnog korisnika sa .catch() handlerom koji sprečava unhandled rejection
    const res = await supabase.auth.signInAnonymously().catch(() => ({ data: null, error: { message: 'Failed to fetch' } }))

    if (res.error || !res.data) {
      return
    }

    if (res.data.user) {
      // Sačuvaj device_id u profil
      const deviceId = getOrCreateDeviceId()
      try {
        await supabase
          .from('profiles')
          .update({ device_id: deviceId })
          .eq('id', res.data.user.id)
      } catch {}
    }
  } catch {
    // Potpuno sprečava iskakanje slepog prozora sa greškom
  }
}

/**
 * Proverava da li trenutni korisnik ima postavljeno korisničko ime.
 * Vraća true ako ima nickname, false ako nema.
 */
export async function checkHasNickname(): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const localNick = localStorage.getItem('brzokucanje_nickname')
    if (localNick && localNick.trim() !== '') {
      return true
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!url || url.includes('placeholder') || url.includes('your-project')) {
    return false
  }

  try {
    const supabase = createClient()
    const userRes = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
    const user = userRes.data?.user


    if (!user) {
      return false
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    if (profile?.username && profile.username.trim() !== '') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('brzokucanje_nickname', profile.username)
      }
      return true
    }

    return false
  } catch {
    return false
  }
}

