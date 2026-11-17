import { NextResponse } from 'next/server'
import * as desarrollosDal from '@/lib/dal/desarrollos'
import { requirePermission, isAuthError } from '@/lib/auth/permissions'
import type { Desarrollo } from '@/types/desarrollo'

/** Permisos para subir unidades por PDF: ver el desarrollo y crear + editar propiedades. */
const PERMISOS = ['desarrollos.view', 'propiedades.create', 'propiedades.edit'] as const

/**
 * Verifica permisos y carga el desarrollo con su "Nombre Kibah" (la liga con sus unidades).
 * Devuelve el desarrollo o una respuesta de error lista para regresar.
 */
export async function authorizeUnidadesPdf(id: string): Promise<{ desarrollo: Desarrollo; nombreKibah: string } | NextResponse> {
  for (const p of PERMISOS) {
    const auth = await requirePermission(p)
    if (isAuthError(auth)) return auth
  }

  const numId = parseInt(id, 10)
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const desarrollo = await desarrollosDal.getDesarrolloById(numId)
  if (!desarrollo) return NextResponse.json({ error: 'Desarrollo no encontrado' }, { status: 404 })

  const nombreKibah = desarrollo.nombre_kibah?.trim()
  if (!nombreKibah) {
    return NextResponse.json({ error: 'El desarrollo no tiene "Nombre Kibah"; agrégalo antes de subir unidades.' }, { status: 400 })
  }
  return { desarrollo, nombreKibah }
}
