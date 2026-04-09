import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
      supabase.from('propiedades_view').select('colonia').not('colonia', 'is', null),
      supabase.from('propiedades_view').select('alcaldia').not('alcaldia', 'is', null),
      supabase.from('propiedades_view').select('disponibilidad').not('disponibilidad', 'is', null),
      supabase.from('propiedades_view').select('tipo_preventa').not('tipo_preventa', 'is', null),
      supabase.from('propiedades_view').select('tipo_entrega').not('tipo_entrega', 'is', null),
    ])

  const unique = (arr: Record<string, unknown>[] | null, key: string): string[] =>
    [...new Set((arr ?? []).map((r) => String(r[key])).filter(Boolean))].sort()

  const response = NextResponse.json({
    colonias: unique(colonias.data, 'colonia'),
    alcaldias: unique(alcaldias.data, 'alcaldia'),
    disponibilidades: unique(disponibilidades.data, 'disponibilidad'),
    tipos_preventa: unique(tiposPreventa.data, 'tipo_preventa'),
    tipos_entrega: unique(tiposEntrega.data, 'tipo_entrega'),
  })

  // Cache for 5 minutes
  response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60')

  return response
}
