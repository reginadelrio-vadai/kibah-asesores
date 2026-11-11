import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as desarrollosDal from '@/lib/dal/desarrollos'
import * as unidadesDal from '@/lib/dal/desarrollo-unidades'
import { requirePermission, isAuthError } from '@/lib/auth/permissions'
import { UNIDADES_PER_PAGE } from '@/lib/utils/constants'

const querySchema = z.object({
  cursor: z.string().regex(/^\d+$/).optional(),
  torre: z.string().trim().min(1).max(200).optional(),
  q: z.string().trim().max(50).optional().transform((v) => v || undefined),
  per_page: z.coerce.number().int().min(1).max(50).default(UNIDADES_PER_PAGE),
  include_summary: z.enum(['0', '1']).default('0'),
})

/** Unidades (hijas) de un desarrollo, ligadas por "Nombre Kibah". Solo lectura. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Ver un desarrollo y además ver las unidades (precios, disponibilidad).
  const authDesarrollos = await requirePermission('desarrollos.view')
  if (isAuthError(authDesarrollos)) return authDesarrollos
  const authPropiedades = await requirePermission('propiedades.view')
  if (isAuthError(authPropiedades)) return authPropiedades

  const { id } = await params
  const numId = parseInt(id, 10)
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 })
  }
  const { cursor, torre, q, per_page, include_summary } = parsed.data

  const desarrollo = await desarrollosDal.getDesarrolloById(numId)
  if (!desarrollo) return NextResponse.json({ error: 'Desarrollo no encontrado' }, { status: 404 })

  const nombreKibah = desarrollo.nombre_kibah?.trim()
  if (!nombreKibah) {
    return NextResponse.json({
      data: [],
      summary: include_summary === '1' ? { total: 0, disponibles: 0, precio_min: null, precio_max: null, torres: [] } : undefined,
      pagination: { per_page, next_cursor: null, has_more: false },
    })
  }

  try {
    const [page, summary] = await Promise.all([
      unidadesDal.getUnidadesByNombreKibah(nombreKibah, { torre, q, cursor, perPage: per_page }),
      include_summary === '1' ? unidadesDal.getUnidadesResumen(nombreKibah) : Promise.resolve(undefined),
    ])

    return NextResponse.json({
      data: page.data,
      summary,
      pagination: { per_page, next_cursor: page.nextCursor, has_more: !!page.nextCursor },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al cargar unidades'
    console.error('Error fetching desarrollo unidades:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
