import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function fetchAllDistinct(
  supabase: Awaited<ReturnType<typeof createClient>>,
  column: string
): Promise<string[]> {
  const values = new Set<string>()
  const pageSize = 1000
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data } = await supabase
      .from('propiedades_view')
      .select(column)
      .not(column, 'is', null)
      .range(offset, offset + pageSize - 1)

    if (!data || data.length === 0) {
      hasMore = false
      break
    }

    for (const row of data) {
      const val = (row as unknown as Record<string, unknown>)[column]
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        values.add(String(val))
      }
    }

    if (data.length < pageSize) {
      hasMore = false
    } else {
      offset += pageSize
    }
  }

  return [...values].sort()
}

/**
 * Desarrollos (Nombre Kibah) con sus torres (Nombre Desarrollador), para el filtro "Desarrollo".
 * Pagina igual que fetchAllDistinct para no perder filas por el tope de 1000 de PostgREST.
 */
async function fetchDesarrolloOptions(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ nombre_kibah: string; torres: string[] }[]> {
  const map = new Map<string, { nombre_kibah: string; torres: Set<string> }>()
  const pageSize = 1000
  let offset = 0

  while (true) {
    const { data } = await supabase
      .from('propiedades_view')
      .select('nombre_kibah, nombre_desarrollador')
      .not('nombre_kibah', 'is', null)
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (!data || data.length === 0) break

    for (const row of data as { nombre_kibah: string | null; nombre_desarrollador: string | null }[]) {
      const nombre = row.nombre_kibah?.trim()
      if (!nombre) continue
      const key = nombre.toLowerCase()
      const entry = map.get(key) ?? { nombre_kibah: nombre, torres: new Set<string>() }
      const torre = row.nombre_desarrollador?.trim()
      if (torre) entry.torres.add(torre)
      map.set(key, entry)
    }

    if (data.length < pageSize) break
    offset += pageSize
  }

  return [...map.values()]
    .map((e) => ({ nombre_kibah: e.nombre_kibah, torres: [...e.torres].sort() }))
    .sort((a, b) => a.nombre_kibah.localeCompare(b.nombre_kibah, 'es'))
}

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [colonias, alcaldias, disponibilidades, tiposPreventa, tiposEntrega, desarrollos] =
    await Promise.all([
      fetchAllDistinct(supabase, 'colonia'),
      fetchAllDistinct(supabase, 'alcaldia'),
      fetchAllDistinct(supabase, 'disponibilidad'),
      fetchAllDistinct(supabase, 'tipo_preventa'),
      fetchAllDistinct(supabase, 'tipo_entrega'),
      fetchDesarrolloOptions(supabase),
    ])

  const response = NextResponse.json({
    colonias,
    alcaldias,
    disponibilidades,
    tipos_preventa: tiposPreventa,
    tipos_entrega: tiposEntrega,
    desarrollos,
  })

  // Cache for 5 minutes
  response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60')

  return response
}
