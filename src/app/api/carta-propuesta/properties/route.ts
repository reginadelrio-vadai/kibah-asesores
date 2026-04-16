import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, isAuthError } from '@/lib/auth/permissions'

export async function GET() {
  const auth = await requirePermission('carta_propuesta.view')
  if (isAuthError(auth)) return auth

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('propiedades_view')
    .select('id, nombre_kibah, nombre_desarrollador, unidad, colonia, direccion, precio_unidad, contacto_desarrollador')
    .order('nombre_kibah', { ascending: true, nullsFirst: false })
    .limit(5000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data: data ?? [] })
}
