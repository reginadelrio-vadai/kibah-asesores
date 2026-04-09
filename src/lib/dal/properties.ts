import { createClient } from '@/lib/supabase/server'
import type { Property } from '@/types'

interface PropertyFilters {
  alcaldia?: string
  colonia?: string
  disponibilidad?: string
  tipo_preventa?: string
  tipo_entrega?: string
  precio_min?: number
  precio_max?: number
  recamaras_min?: number
  search?: string
}

interface PaginatedResult {
  data: Property[]
  nextCursor: string | null
}

export async function getProperties(
  filters: PropertyFilters = {},
  cursor?: string,
  perPage = 20
): Promise<PaginatedResult> {
  const supabase = await createClient()

  let query = supabase
    .from('propiedades_view')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(perPage + 1)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  if (filters.alcaldia) {
    query = query.eq('alcaldia', filters.alcaldia)
  }
  if (filters.colonia) {
    query = query.eq('colonia', filters.colonia)
  }
  if (filters.disponibilidad) {
    query = query.eq('disponibilidad', filters.disponibilidad)
  }
  if (filters.tipo_preventa) {
    query = query.eq('tipo_preventa', filters.tipo_preventa)
  }
  if (filters.tipo_entrega) {
    query = query.eq('tipo_entrega', filters.tipo_entrega)
  }
  if (filters.precio_min) {
    query = query.gte('precio_unidad', filters.precio_min)
  }
  if (filters.precio_max) {
    query = query.lte('precio_unidad', filters.precio_max)
  }
  if (filters.recamaras_min) {
    query = query.gte('num_recamaras', filters.recamaras_min)
  }
  if (filters.search) {
    query = query.or(
      `nombre_desarrollador.ilike.%${filters.search}%,colonia.ilike.%${filters.search}%,alcaldia.ilike.%${filters.search}%,nombre_kibah.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching properties:', error.message)
    return { data: [], nextCursor: null }
  }

  const properties = data as Property[]
  const hasMore = properties.length > perPage
  if (hasMore) properties.pop()

  return {
    data: properties,
    nextCursor: hasMore
      ? properties[properties.length - 1].created_at
      : null,
  }
}

export async function getPropertyById(
  id: string
): Promise<Property | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('propiedades_view')
    .select('*')
    .eq('id_propiedad', id)
    .single()

  if (error) {
    console.error('Error fetching property:', error.message)
    return null
  }

  return data as Property
}

export async function getFilterOptions(): Promise<{
  alcaldias: string[]
  colonias: string[]
  disponibilidades: string[]
  tipos_preventa: string[]
  tipos_entrega: string[]
}> {
  const supabase = await createClient()

  const [alcaldias, colonias, disponibilidades, tipos_preventa, tipos_entrega] =
    await Promise.all([
      supabase
        .from('propiedades_view')
        .select('alcaldia')
        .not('alcaldia', 'is', null),
      supabase
        .from('propiedades_view')
        .select('colonia')
        .not('colonia', 'is', null),
      supabase
        .from('propiedades_view')
        .select('disponibilidad')
        .not('disponibilidad', 'is', null),
      supabase
        .from('propiedades_view')
        .select('tipo_preventa')
        .not('tipo_preventa', 'is', null),
      supabase
        .from('propiedades_view')
        .select('tipo_entrega')
        .not('tipo_entrega', 'is', null),
    ])

  return {
    alcaldias: [
      ...new Set((alcaldias.data ?? []).map((r) => r.alcaldia as string)),
    ].sort(),
    colonias: [
      ...new Set((colonias.data ?? []).map((r) => r.colonia as string)),
    ].sort(),
    disponibilidades: [
      ...new Set(
        (disponibilidades.data ?? []).map((r) => r.disponibilidad as string)
      ),
    ].sort(),
    tipos_preventa: [
      ...new Set(
        (tipos_preventa.data ?? []).map((r) => r.tipo_preventa as string)
      ),
    ].sort(),
    tipos_entrega: [
      ...new Set(
        (tipos_entrega.data ?? []).map((r) => r.tipo_entrega as string)
      ),
    ].sort(),
  }
}
