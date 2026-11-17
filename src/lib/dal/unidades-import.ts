import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Desarrollo } from '@/types/desarrollo'
import type { UnidadExistente, ImportarUnidadesResponse } from '@/types/unidades-pdf'
import { mapUnidadPdfToDB, type ImportarUnidadesInput } from '@/lib/validations/unidades-pdf'
import { UNIDADES_RESUMEN_MAX_ROWS } from '@/lib/utils/constants'
import { buscarExistente } from '@/lib/utils/unidades-pdf'
import { escapeIlike } from '@/lib/utils/ilike'

/** Error de datos que el usuario puede corregir en la revisión (responde 400). */
export class ImportarUnidadesError extends Error {}

/** Actualizaciones en paralelo por tanda (base Nano compartida: no saturarla). */
const UPDATE_BATCH = 10

/** Unidades que ya tiene el desarrollo (misma liga por "Nombre Kibah" que el detalle). */
export async function getUnidadesExistentes(nombreKibah: string): Promise<UnidadExistente[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('propiedades_view')
    .select('id, unidad, nombre_desarrollador, disponibilidad')
    .ilike('nombre_kibah', escapeIlike(nombreKibah))
    .limit(UNIDADES_RESUMEN_MAX_ROWS)

  if (error) throw new Error(error.message)
  type Row = { id: number; unidad: string | null; nombre_desarrollador: string | null; disponibilidad: string | null }
  return ((data ?? []) as Row[])
    .filter((r) => r.unidad?.trim())
    .map((r) => ({ id: r.id, unidad: r.unidad!.trim(), torre: r.nombre_desarrollador, disponibilidad: r.disponibilidad }))
}

/** Fecha en el formato que ya usa base_kibah: dd/mm/aaaa (hora de CDMX). */
function hoy(): string {
  return new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date())
}

function lote(): string {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? ''
  return `PDF-${get('year')}-${get('month')}-${get('day')}-${get('hour')}${get('minute')}${get('second')}`
}

/** Datos que las unidades nuevas heredan del desarrollo (padre). */
function heredados(d: Desarrollo, torre: string | null): Record<string, string | null> {
  return {
    'Nombre Kibah': d.nombre_kibah,
    'Nombre Desarrollador': torre || d.nombre_desarrollador,
    'Dirección': d.direccion_bdd || d.direccion,
    'Colonia': d.colonia,
    'Alcaldia': d.alcaldia,
    'Amenidades': d.amenidades,
    'Desarrollador/Propietario (Whats grupo)': d.contacto_desarrollador,
    'Fecha de Construcción/Entrega': d.fecha_entrega,
    'Entrega Inmediata/Preventa': d.tipo_preventa,
    'Tipo de Entrega': d.tipo_entrega,
    '% Comisión': d.pct_comision === null ? null : String(d.pct_comision),
  }
}

/**
 * Inserta las unidades nuevas y actualiza las que ya existen (mismo número de unidad y misma torre,
 * ver buscarExistente). Qué es nueva y qué es existente lo decide el servidor, no el navegador.
 */
export async function importarUnidades(
  desarrollo: Desarrollo,
  input: ImportarUnidadesInput
): Promise<ImportarUnidadesResponse> {
  const nombreKibah = desarrollo.nombre_kibah!.trim()
  const existentes = await getUnidadesExistentes(nombreKibah)

  const fecha = hoy()
  const inserts: Record<string, string | null>[] = []
  const updates: { id: number; row: Record<string, string | null> }[] = []
  const loteCarga = lote()

  const ambiguas: string[] = []
  const usados = new Set<number>()

  for (const u of input.unidades) {
    const row = { ...mapUnidadPdfToDB(u, input.precio_principal), 'Fecha de Actualización': fecha }
    const c = buscarExistente(existentes, u.unidad, input.torre)
    if (c.ambigua) { ambiguas.push(u.unidad); continue }
    const id = c.existente?.id
    if (id !== undefined && usados.has(id)) throw new ImportarUnidadesError(`La unidad ${u.unidad} viene dos veces en el PDF`)
    if (id !== undefined) { usados.add(id); updates.push({ id, row }) }
    else inserts.push({ ...heredados(desarrollo, input.torre), ...row, lote_carga: loteCarga })
  }

  if (ambiguas.length > 0) {
    throw new ImportarUnidadesError(`Hay varias unidades existentes con el número ${ambiguas.join(', ')}. Escribe la torre para saber cuál actualizar.`)
  }

  const supabase = createAdminClient()

  if (inserts.length > 0) {
    const { error } = await supabase.from('base_kibah').insert(inserts)
    if (error) throw new Error(error.message)
  }

  for (let i = 0; i < updates.length; i += UPDATE_BATCH) {
    const results = await Promise.all(
      updates.slice(i, i + UPDATE_BATCH).map(({ id, row }) =>
        supabase.from('base_kibah').update(row).eq('id', id)
      )
    )
    const failed = results.find((r) => r.error)
    if (failed?.error) throw new Error(failed.error.message)
  }

  return { insertadas: inserts.length, actualizadas: updates.length }
}
