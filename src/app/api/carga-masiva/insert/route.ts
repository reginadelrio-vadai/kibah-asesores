import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, isAuthError } from '@/lib/auth/permissions'

export async function POST(request: NextRequest) {
  const auth = await requirePermission('carga_masiva.view')
  if (isAuthError(auth)) return auth

  try {
    const body = await request.json()
    const { type, lote, items } = body as {
      type: 'propiedades' | 'desarrollos'
      lote: string
      items: Array<Record<string, unknown>>
    }

    if (!type || !lote || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'type, lote, and items required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const table = type === 'propiedades' ? 'base_kibah' : 'pagina_web_kibah'

    const rows = items.map((item) => ({ ...item, lote_carga: lote }))

    const { error } = await supabase.from(table).insert(rows)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: items.length, lote })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
