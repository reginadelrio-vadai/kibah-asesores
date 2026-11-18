import { NextRequest, NextResponse } from 'next/server'
import { authorizeUnidadesPdf } from '@/lib/auth/unidades-pdf-auth'
import { importarUnidadesSchema } from '@/lib/validations/unidades-pdf'
import { importarUnidades, ImportarUnidadesError } from '@/lib/dal/unidades-import'
import * as desarrollosDal from '@/lib/dal/desarrollos'
import { requirePermission, isAuthError } from '@/lib/auth/permissions'

/** Guarda en base_kibah las unidades que el usuario revisó y confirmó. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await authorizeUnidadesPdf(id)
  if (ctx instanceof NextResponse) return ctx

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = importarUnidadesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed', details: parsed.error.issues },
      { status: 400 }
    )
  }

  // Cambiar el Link Drive del desarrollo (la fuente que heredan las unidades) requiere poder editar desarrollos.
  let desarrollo = ctx.desarrollo
  if (parsed.data.link_drive_desarrollo !== undefined) {
    const auth = await requirePermission('desarrollos.edit')
    if (isAuthError(auth)) return auth
    try {
      await desarrollosDal.updateDesarrollo(desarrollo.id, { link_drive: parsed.data.link_drive_desarrollo || null })
      desarrollo = { ...desarrollo, link_drive: parsed.data.link_drive_desarrollo || null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar el Link Drive'
      return NextResponse.json({ error: `No se pudo guardar el Link Drive del desarrollo: ${message}` }, { status: 500 })
    }
  }

  try {
    const result = await importarUnidades(desarrollo, parsed.data)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof ImportarUnidadesError) return NextResponse.json({ error: err.message }, { status: 400 })
    const message = err instanceof Error ? err.message : 'Error al guardar unidades'
    console.error('Error importando unidades:', message)
    // Columna faltante = no se ha corrido sql/007-unidades-pdf.sql en Supabase.
    if (/column|schema cache/i.test(message)) {
      return NextResponse.json({ error: `Falta correr sql/007-unidades-pdf.sql o sql/008-bodega-m2.sql en Supabase (${message})` }, { status: 500 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
