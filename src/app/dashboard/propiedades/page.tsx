import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal/users'
import { PropiedadesView } from './propiedades-view'

export default async function PropiedadesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role: 'asesor' | 'admin' = 'asesor'
  if (user) {
    const profile = await getProfile(user.id)
    if (profile) role = profile.role
  }

  return <PropiedadesView role={role} />
}
