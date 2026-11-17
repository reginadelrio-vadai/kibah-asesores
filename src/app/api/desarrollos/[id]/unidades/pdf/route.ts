import { NextRequest, NextResponse } from 'next/server'
import { authorizeUnidadesPdf } from '@/lib/auth/unidades-pdf-auth'
import { leerUnidadesDePdf, LecturaPdfError } from '@/lib/services/unidades-pdf-service'
import { getUnidadesExistentes } from '@/lib/dal/unidades-import'
import { getLinksPropiosRespaldo } from '@/lib/dal/links-drive'
import { UNIDADES_PDF_MAX_BYTES } from '@/lib/utils/constants'
import type { LecturaPdfResponse } from '@/types/unidades-pdf'

// Claude puede tardar más de un minuto en leer una lista de precios larga.
export const maxDuration = 300

const PDF_MAGIC = '%PDF-'

/** Lee un PDF de unidades con Claude. No guarda nada: solo devuelve lo leído para revisarlo. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await authorizeUnidadesPdf(id)
  if (ctx instanceof NextResponse) return ctx

  let file: File | null
  try {
    const form = await request.formData()
    const value = form.get('file')
    file = value instanceof File ? value : null
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el archivo enviado.' }, { status: 400 })
  }

  if (!file) return NextResponse.json({ error: 'Selecciona un PDF.' }, { status: 400 })
  if (file.size > UNIDADES_PDF_MAX_BYTES) {
    return NextResponse.json({ error: 'El PDF pesa más de 4 MB. Comprímelo o divídelo.' }, { status: 413 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  if (buffer.subarray(0, PDF_MAGIC.length).toString('latin1') !== PDF_MAGIC) {
    return NextResponse.json({ error: 'El archivo no es un PDF válido.' }, { status: 400 })
  }

  try {
    const linkDesarrollo = ctx.desarrollo.link_drive ?? null
    const [lectura, existentes, links_propios] = await Promise.all([
      leerUnidadesDePdf(buffer, ctx.nombreKibah),
      getUnidadesExistentes(ctx.nombreKibah),
      getLinksPropiosRespaldo(ctx.nombreKibah, linkDesarrollo),
    ])
    const body: LecturaPdfResponse = { lectura, existentes, link_drive_desarrollo: linkDesarrollo, links_propios }
    return NextResponse.json(body)
  } catch (err) {
    if (err instanceof LecturaPdfError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('Error leyendo PDF de unidades:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Error al leer el PDF' }, { status: 500 })
  }
}
