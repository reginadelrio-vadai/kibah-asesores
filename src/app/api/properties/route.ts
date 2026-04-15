import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createPropertySchema } from '@/lib/validations/property'
import * as propertyService from '@/lib/services/property-service'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const cursor = params.get('cursor')
  const perPage = Math.min(Math.max(parseInt(params.get('per_page') ?? '20') || 20, 1), 50)
  const sortBy = params.get('sort_by') ?? 'created_at'
  const sortOrder = params.get('sort_order') === 'asc' ? true : false

  let query = supabase
    .from('propiedades_view')
    .select('*')
    .order(sortBy, { ascending: sortOrder })
    .limit(perPage + 1)

  if (cursor) {
    if (sortOrder) {
      query = query.gt('id', cursor)
    } else {
      query = query.lt('id', cursor)
    }
  }

  // Apply filters from query params
  const filterParams = [
    'alcaldia',
    'colonia',
    'disponibilidad',
    'tipo_preventa',
    'tipo_entrega',
    'bodega',
  ]
  for (const key of filterParams) {
    const value = params.get(key)
    if (value) {
      query = query.eq(key, value)
    }
  }

  // Range filters
  const rangeParams = [
    'precio_unidad',
    'm2_totales',
    'm2_habitables',
    'm2_exteriores',
    'm2_roof_garden',
    'num_recamaras',
    'num_banos',
    'estacionamiento',
    'pct_comision',
  ]
  for (const key of rangeParams) {
    const min = params.get(`${key}_min`)
    const max = params.get(`${key}_max`)
    // Cast to numeric — the view columns are text, so plain gte/lte
    // compare lexicographically (e.g. "176" < "50" as strings).
    if (min !== null && min !== '' && !isNaN(Number(min))) {
      query = query.filter(`${key}::numeric`, 'gte', Number(min))
    }
    if (max !== null && max !== '' && !isNaN(Number(max))) {
      query = query.filter(`${key}::numeric`, 'lte', Number(max))
    }
  }

  // Text search
  const search = params.get('search')
  if (search) {
    query = query.or(
      `nombre_desarrollador.ilike.%${search}%,colonia.ilike.%${search}%,alcaldia.ilike.%${search}%,nombre_kibah.ilike.%${search}%,direccion.ilike.%${search}%,unidad.ilike.%${search}%`
    )
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching properties:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const hasMore = (data?.length ?? 0) > perPage
  const items = data ?? []
  if (hasMore) items.pop()

  const nextCursor = hasMore && items.length > 0
    ? String(items[items.length - 1].id)
    : null

  return NextResponse.json({
    data: items,
    pagination: {
      per_page: perPage,
      next_cursor: nextCursor,
      has_more: hasMore,
    },
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validated = createPropertySchema.parse(body)
    const property = await propertyService.createProperty(validated)
    return NextResponse.json({ data: property }, { status: 201 })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.issues },
        { status: 400 }
      )
    }
    const message = err instanceof Error ? err.message : 'Error creating property'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
