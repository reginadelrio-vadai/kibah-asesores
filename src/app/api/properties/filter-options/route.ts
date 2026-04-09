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

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [colonias, alcaldias, disponibilidades, tiposPreventa, tiposEntrega] =
    await Promise.all([
      fetchAllDistinct(supabase, 'colonia'),
      fetchAllDistinct(supabase, 'alcaldia'),
      fetchAllDistinct(supabase, 'disponibilidad'),
      fetchAllDistinct(supabase, 'tipo_preventa'),
      fetchAllDistinct(supabase, 'tipo_entrega'),
    ])

  const response = NextResponse.json({
    colonias,
    alcaldias,
    disponibilidades,
    tipos_preventa: tiposPreventa,
    tipos_entrega: tiposEntrega,
  })

  // Cache for 5 minutes
  response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60')

  return response
}
