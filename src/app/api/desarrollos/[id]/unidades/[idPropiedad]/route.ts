import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as propertiesDal from '@/lib/dal/properties'
import { requirePermission, isAuthError } from '@/lib/auth/permissions'

const idPropiedadSchema = z.string().min(1).max(100).regex(/^[A-Za-z0-9-]+$/)

/** Ficha completa de una unidad (hija) desde el detalle de un desarrollo. Solo lectura. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; idPropiedad: string }> }
) {
  const authDesarrollos = await requirePermission('desarrollos.view')
  if (isAuthError(authDesarrollos)) return authDesarrollos
  const authPropiedades = await requirePermission('propiedades.view')
  if (isAuthError(authPropiedades)) return authPropiedades

  const { idPropiedad } = await params
  const parsed = idPropiedadSchema.safeParse(idPropiedad)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const property = await propertiesDal.getPropertyById(parsed.data)
  if (!property) return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 })

  return NextResponse.json({ data: property })
}
