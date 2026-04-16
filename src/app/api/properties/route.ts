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

  // Numeric columns — propiedades_view now exposes these as NUMERIC.
  // Plain .gte/.lte with Number() works. Empty-string query params must
  // be guarded before reaching here (comparing numeric col to '' errors).
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

  // Range filters — strict empty-string guard before applying.
  for (const key of NUMERIC_COLS) {
    const minRaw = params.get(`${key}_min`)
    const maxRaw = params.get(`${key}_max`)
    if (minRaw !== null && minRaw.trim() !== '' && !isNaN(Number(minRaw))) {
      query = query.gte(key, Number(minRaw))
    }
    if (maxRaw !== null && maxRaw.trim() !== '' && !isNaN(Number(maxRaw))) {
      query = query.lte(key, Number(maxRaw))
    }
  }

  // Text search — ilike is case-insensitive. To also handle accents,
  // replace vowels in the query with _ (SQL single-char wildcard) so
  // "mexico" becomes "m_xic_" matching "México".
  const search = params.get('search')
  if (search) {
    const accent = search.replace(/[aáàä]/gi, '_').replace(/[eéèë]/gi, '_').replace(/[iíìï]/gi, '_').replace(/[oóòö]/gi, '_').replace(/[uúùü]/gi, '_')
    const cols = ['nombre_desarrollador', 'colonia', 'alcaldia', 'nombre_kibah', 'direccion', 'unidad']
    const conditions = cols.map((c) => `${c}.ilike.%${accent}%`).join(',')
    query = query.or(conditions)
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
