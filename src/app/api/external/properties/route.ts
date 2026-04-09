import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import * as apiKeyService from '@/lib/services/api-key-service'

export async function GET(request: NextRequest) {
  // Auth
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 })
  }

  const key = await apiKeyService.validateApiKey(apiKey)
  if (!key) {
    return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 })
  }

  if (!key.permissions.includes('properties.read')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  if (!apiKeyService.checkRateLimit(key.id)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  // Query
  const supabase = createAdminClient()
  const params = request.nextUrl.searchParams
  const cursor = params.get('cursor')
  const perPage = Math.min(Math.max(parseInt(params.get('per_page') ?? '20') || 20, 1), 50)
  const sortBy = params.get('sort_by') ?? 'created_at'
  const sortOrder = params.get('sort_order') === 'asc'

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

  // Eq filters
  const filterParams = ['alcaldia', 'colonia', 'disponibilidad', 'tipo_preventa', 'tipo_entrega', 'bodega']
  for (const k of filterParams) {
    const v = params.get(k)
    if (v) query = query.eq(k, v)
  }

  // Range filters
  const rangeParams = ['precio_unidad', 'm2_totales', 'num_recamaras', 'num_banos']
  for (const k of rangeParams) {
    const min = params.get(`${k}_min`)
    const max = params.get(`${k}_max`)
    if (min) query = query.gte(k, parseFloat(min))
    if (max) query = query.lte(k, parseFloat(max))
  }

  // Search
  const search = params.get('search')
  if (search) {
    query = query.or(
      `nombre_desarrollador.ilike.%${search}%,colonia.ilike.%${search}%,alcaldia.ilike.%${search}%,nombre_kibah.ilike.%${search}%`
    )
  }

  const { data, error } = await query

  if (error) {
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
    pagination: { per_page: perPage, next_cursor: nextCursor, has_more: hasMore },
  })
}
