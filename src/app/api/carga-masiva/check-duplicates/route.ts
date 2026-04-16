import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, isAuthError } from '@/lib/auth/permissions'

export async function POST(request: NextRequest) {
  const auth = await requirePermission('carga_masiva.view')
  if (isAuthError(auth)) return auth

  try {
    const body = await request.json()
    const { type, items } = body as {
      type: 'propiedades' | 'desarrollos'
      items: Array<{ nombre_kibah: string; unidad?: string; row: number }>
    }

    if (!type || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'type and items required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const duplicates: Array<{ nombre_kibah: string; unidad?: string; row: number }> = []

    if (type === 'propiedades') {
      const names = [...new Set(items.map((i) => i.nombre_kibah))]
      if (names.length === 0) return NextResponse.json({ duplicates: [] })

      const { data } = await supabase
        .from('base_kibah')
        .select('"Nombre Kibah", "Unidad"')
        .in('"Nombre Kibah"', names)

      if (data && data.length > 0) {
        const existing = new Set(
          data.map((r) => `${(r as Record<string, string>)['Nombre Kibah']}|||${(r as Record<string, string>)['Unidad'] ?? ''}`)
        )
        for (const item of items) {
          const key = `${item.nombre_kibah}|||${item.unidad ?? ''}`
          if (existing.has(key)) duplicates.push(item)
        }
      }
    } else {
      const names = [...new Set(items.map((i) => i.nombre_kibah))]
      if (names.length === 0) return NextResponse.json({ duplicates: [] })

      const { data } = await supabase
        .from('pagina_web_kibah')
        .select('"Nombre Kibah"')
        .in('"Nombre Kibah"', names)

      if (data && data.length > 0) {
        const existing = new Set(data.map((r) => (r as Record<string, string>)['Nombre Kibah']))
        for (const item of items) {
          if (existing.has(item.nombre_kibah)) duplicates.push(item)
        }
      }
    }

    return NextResponse.json({ duplicates })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
