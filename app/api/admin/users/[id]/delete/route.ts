import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

type Ctx = { params: Promise<{ id: string }> }

type AdminAuthClient = {
  auth: {
    admin: {
      deleteUser: (id: string) => Promise<{ error: Error | null }>
    }
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { user: admin, error } = await requireAdmin()
  if (error) return error

  const { id } = await ctx.params
  let body: { confirmUsername?: unknown }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Neispravan zahtev' }, { status: 400 })
  }

  const confirmUsername = typeof body.confirmUsername === 'string' ? body.confirmUsername.trim() : ''
  const supabase = await createServiceClient()

  const { data: target } = await supabase
    .from('profiles')
    .select('id, username, is_admin')
    .eq('id', id)
    .maybeSingle()

  if (!target?.username?.trim()) {
    return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 })
  }

  if (target.id === admin!.id) {
    return NextResponse.json({ error: 'Ne možete obrisati sopstveni admin nalog' }, { status: 422 })
  }

  if (target.is_admin) {
    return NextResponse.json({ error: 'Brisanje admin naloga nije dozvoljeno u ovoj verziji' }, { status: 422 })
  }

  if (confirmUsername !== target.username) {
    return NextResponse.json({ error: 'Za potvrdu unesite tačan username korisnika' }, { status: 400 })
  }

  await supabase.from('admin_actions').insert({
    admin_id: admin!.id,
    action: 'delete_user',
    target_type: 'user',
    target_id: id,
    details: { username: target.username },
  })

  const { error: deleteError } = await (supabase as unknown as AdminAuthClient).auth.admin.deleteUser(id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
