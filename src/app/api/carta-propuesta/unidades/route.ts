import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, isAuthError } from '@/lib/auth/permissions'

export async function GET(request: NextRequest) {
  const auth = await requirePermission('carta_propuesta.view')
  if (isAuthError(auth)) return auth

  const nombreKibah = request.nextUrl.searchParams.get('nombre_kibah')
  if (!nombreKibah) {
    return NextResponse.json({ error: 'nombre_kibah required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('propiedades_view')
    .select('id, unidad, direccion, colonia, precio_unidad')
    .eq('nombre_kibah', nombreKibah)
    .order('unidad', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}
