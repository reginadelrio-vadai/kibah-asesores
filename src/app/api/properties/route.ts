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

  // Numeric columns — the view's underlying columns are text. We cast
  // via .filter('col::numeric', ...) per-filter so empty-string rows are
  // only cast when the filter applies (after excluding them with .not).
  const NUMERIC_COLS = [
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

  // Range filters — only apply if user actually provided a numeric value.
  // Strict guard: empty string → skip entirely (was causing "invalid input
  // syntax for type numeric: ''" on the PostgreSQL side).
  for (const key of NUMERIC_COLS) {
    const minRaw = params.get(`${key}_min`)
    const maxRaw = params.get(`${key}_max`)
    const hasMin = minRaw !== null && minRaw.trim() !== '' && !isNaN(Number(minRaw))
    const hasMax = maxRaw !== null && maxRaw.trim() !== '' && !isNaN(Number(maxRaw))
    if (hasMin || hasMax) {
      // Exclude rows where the column is NULL or empty-string so the
      // ::numeric cast doesn't error per-row.
      query = query.not(key, 'is', null).not(key, 'eq', '')
    }
    if (hasMin) {
      query = query.filter(`${key}::numeric`, 'gte', Number(minRaw))
    }
    if (hasMax) {
      query = query.filter(`${key}::numeric`, 'lte', Number(maxRaw))
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
