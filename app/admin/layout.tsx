import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { PrijavaForma } from '@/components/auth/PrijavaForma'
import type { Database } from '@/lib/supabase/types'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = null
  let isAdmin = false

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user

    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      type ProfileRow = Pick<Database['public']['Tables']['profiles']['Row'], 'is_admin'>
      const profile = profileData as ProfileRow | null
      isAdmin = !!profile?.is_admin
    }
  } catch {
    isAdmin = false
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-xl">
          <PrijavaForma redirectTo="/admin/pregled" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-[var(--background)] pt-12 md:pt-0">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
