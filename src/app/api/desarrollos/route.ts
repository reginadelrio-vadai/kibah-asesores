import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createDesarrolloSchema } from '@/lib/validations/desarrollo'
import * as dal from '@/lib/dal/desarrollos'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return { error: 'Forbidden', status: 403 }
  return { user }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const params = request.nextUrl.searchParams
  const cursor = params.get('cursor') ?? undefined
  const perPage = Math.min(Math.max(parseInt(params.get('per_page') ?? '20') || 20, 1), 50)

  const filters: Record<string, string | number> = {}
  for (const key of ['colonia', 'alcaldia', 'disponibilidad', 'tipo_preventa', 'search']) {
    const v = params.get(key)
    if (v) filters[key] = v
  }
  const precioMin = params.get('precio_min')
  const precioMax = params.get('precio_max')
  if (precioMin) filters.precio_min = parseFloat(precioMin)
  if (precioMax) filters.precio_max = parseFloat(precioMax)

  const result = await dal.getDesarrollos(filters, cursor, perPage)

  return NextResponse.json({
    data: result.data,
    pagination: { per_page: perPage, next_cursor: result.nextCursor, has_more: !!result.nextCursor },
  })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const body = await request.json()
    const validated = createDesarrolloSchema.parse(body)
    const desarrollo = await dal.insertDesarrollo(validated as Record<string, unknown>)
    return NextResponse.json({ data: desarrollo }, { status: 201 })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 })
    }
    const message = err instanceof Error ? err.message : 'Error creating desarrollo'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
