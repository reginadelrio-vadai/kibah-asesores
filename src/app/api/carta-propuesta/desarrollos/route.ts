import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, isAuthError } from '@/lib/auth/permissions'

export async function GET() {
  const auth = await requirePermission('carta_propuesta.view')
  if (isAuthError(auth)) return auth

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('propiedades_view')
    .select('nombre_kibah')
    .not('nombre_kibah', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const unique = [...new Set(
    (data ?? [])
      .map((r) => (r.nombre_kibah as string | null)?.trim())
      .filter((n): n is string => !!n && n.length > 0)
  )].sort()

  return NextResponse.json({ data: unique })
}
