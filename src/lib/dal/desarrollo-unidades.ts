import { createClient } from '@/lib/supabase/server'
import type { DesarrolloUnidad, DesarrolloUnidadesResumen, TorreResumen } from '@/types/desarrollo'
import {
  DISPONIBILIDAD_OPTIONS,
  TORRE_SIN_NOMBRE,
  UNIDADES_RESUMEN_MAX_ROWS,
} from '@/lib/utils/constants'
import { escapeIlike } from '@/lib/utils/ilike'

/**
 * Unidades (hijas) de un desarrollo. Solo lectura sobre propiedades_view (base_kibah).
 * La liga padre → hijos es por "Nombre Kibah", sin distinguir mayúsculas.
 */

const UNIDAD_COLUMNS =
  'id, id_propiedad, unidad, nombre_desarrollador, disponibilidad, precio_unidad, m2_totales, num_recamaras, num_banos, estacionamiento'

const DISPONIBLE = DISPONIBILIDAD_OPTIONS[0]

/** Igualdad literal sin distinguir mayúsculas (ILIKE sin comodines). */
const exactIlike = escapeIlike

interface UnidadesPage {
  data: DesarrolloUnidad[]
  nextCursor: string | null
}

export async function getUnidadesByNombreKibah(
  nombreKibah: string,
  opts: { torre?: string; q?: string; cursor?: string; perPage: number }
): Promise<UnidadesPage> {
  const supabase = await createClient()

  let query = supabase
    .from('propiedades_view')
    .select(UNIDAD_COLUMNS)
    .ilike('nombre_kibah', exactIlike(nombreKibah))
    .order('id', { ascending: true })
    .limit(opts.perPage + 1)

  if (opts.cursor) query = query.gt('id', opts.cursor)
  if (opts.torre === TORRE_SIN_NOMBRE) query = query.is('nombre_desarrollador', null)
  else if (opts.torre) query = query.eq('nombre_desarrollador', opts.torre)
  if (opts.q) query = query.ilike('unidad', `%${exactIlike(opts.q)}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const items = (data ?? []) as DesarrolloUnidad[]
  const hasMore = items.length > opts.perPage
  if (hasMore) items.pop()

  return {
    data: items,
    nextCursor: hasMore && items.length > 0 ? String(items[items.length - 1].id) : null,
  }
}

/**
 * Cuántas unidades tiene cada Nombre Kibah (misma regla de liga que el detalle).
 * Una consulta de conteo por nombre (sin traer filas). Llave: nombre en minúsculas y sin espacios extra.
 */
export async function countUnidadesByNombresKibah(nombres: string[]): Promise<Record<string, number>> {
  const unique = [...new Set(nombres.map((n) => n.trim()).filter(Boolean))]
  if (unique.length === 0) return {}
  const supabase = await createClient()

  const results = await Promise.all(
    unique.map(async (nombre) => {
      const { count, error } = await supabase
        .from('propiedades_view')
        .select('id', { count: 'exact', head: true })
        .ilike('nombre_kibah', exactIlike(nombre))
      if (error) throw new Error(error.message)
      return [nombre.toLowerCase(), count ?? 0] as const
    })
  )
  return Object.fromEntries(results)
}

interface ResumenRow {
  nombre_desarrollador: string | null
  disponibilidad: string | null
  precio_unidad: number | string | null
}

/**
 * Resumen agregado de las unidades de un desarrollo. Lee solo 3 columnas ligeras
 * en el servidor y devuelve únicamente los totales (nunca la lista completa al cliente).
 */
export async function getUnidadesResumen(nombreKibah: string): Promise<DesarrolloUnidadesResumen> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('propiedades_view')
    .select('nombre_desarrollador, disponibilidad, precio_unidad')
    .ilike('nombre_kibah', exactIlike(nombreKibah))
    .limit(UNIDADES_RESUMEN_MAX_ROWS)

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as ResumenRow[]
  const torres = new Map<string, TorreResumen>()
  let disponibles = 0
  let precioMin: number | null = null
  let precioMax: number | null = null

  for (const r of rows) {
    const isDisponible = r.disponibilidad?.trim().toLowerCase() === DISPONIBLE.toLowerCase()
    if (isDisponible) disponibles++

    const precio = Number(r.precio_unidad)
    if (r.precio_unidad !== null && !isNaN(precio) && precio > 0) {
      precioMin = precioMin === null ? precio : Math.min(precioMin, precio)
      precioMax = precioMax === null ? precio : Math.max(precioMax, precio)
    }

    const nombre = r.nombre_desarrollador?.trim() ? r.nombre_desarrollador : TORRE_SIN_NOMBRE
    const torre = torres.get(nombre) ?? { nombre, total: 0, disponibles: 0 }
    torre.total++
    if (isDisponible) torre.disponibles++
    torres.set(nombre, torre)
  }

  return {
    total: rows.length,
    disponibles,
    precio_min: precioMin,
    precio_max: precioMax,
    torres: [...torres.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
  }
}
