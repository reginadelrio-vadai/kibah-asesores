import { createAdminClient } from '@/lib/supabase/admin'
import { escapeIlike } from '@/lib/utils/ilike'
import {
  BASE_KIBAH_LINK_DRIVE_DESARROLLO,
  BASE_KIBAH_LINK_DRIVE_UNIDAD,
  BASE_KIBAH_M2_BODEGA,
  BASE_KIBAH_NIVEL,
  BASE_KIBAH_ORIENTACION,
  BASE_KIBAH_PRECIO_ENG_PREFIX,
  DESARROLLO_LINK_DRIVE,
  ENGANCHE_OPTIONS,
  RESPALDO_LINKS_DRIVE_TABLE,
} from '@/lib/utils/constants'

/**
 * Links de Drive. Desarrollos (pagina_web_kibah."Link Drive") es la verdad del edificio;
 * cada unidad (base_kibah) guarda una copia en "Link Drive Desarrollo" y, solo si tiene
 * carpeta propia, "Link Drive Unidad". Las vistas no traen estas columnas, así que se leen
 * aquí y se agregan a lo que ya lee la app.
 */

const text = (v: unknown): string | null => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s.length > 0 ? s : null
}
const sameLink = (a: string | null, b: string | null) =>
  !!a && !!b && a.replace(/[?#].*$/, '').replace('/u/0/', '/') === b.replace(/[?#].*$/, '').replace('/u/0/', '/')

// ── Desarrollos ───────────────────────────────────────────────────────

/** Agrega link_drive a desarrollos leídos de desarrollos_view. */
export async function withLinkDriveDesarrollos<T extends { id: number }>(rows: T[]): Promise<(T & { link_drive: string | null })[]> {
  if (rows.length === 0) return []
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('pagina_web_kibah')
    .select(`id, "${DESARROLLO_LINK_DRIVE}"`)
    .in('id', rows.map((r) => r.id))
  if (error) console.error('Error leyendo Link Drive de desarrollos:', error.message)
  const map = new Map((data ?? []).map((r) => [r.id as number, text((r as Record<string, unknown>)[DESARROLLO_LINK_DRIVE])]))
  return rows.map((r) => ({ ...r, link_drive: map.get(r.id) ?? null }))
}

async function linkDriveDeDesarrollo(nombreKibah: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('pagina_web_kibah')
    .select(`"${DESARROLLO_LINK_DRIVE}"`)
    .ilike('Nombre Kibah', escapeIlike(nombreKibah.trim()))
    .limit(1)
  if (error) throw new Error(error.message)
  return text((data?.[0] as Record<string, unknown> | undefined)?.[DESARROLLO_LINK_DRIVE])
}

/**
 * Copia el Link Drive de cada desarrollo a todas sus unidades ("Link Drive Desarrollo").
 * Llamar después de crear/editar unidades o de editar el link / Nombre Kibah de un desarrollo.
 */
export async function syncLinkDriveDesarrollo(nombresKibah: (string | null | undefined)[]): Promise<void> {
  const unicos = [...new Map(nombresKibah.map((n) => n?.trim()).filter((n): n is string => !!n).map((n) => [n.toLowerCase(), n])).values()]
  if (unicos.length === 0) return
  const supabase = createAdminClient()
  for (const nombre of unicos) {
    const link = await linkDriveDeDesarrollo(nombre)
    const { error } = await supabase
      .from('base_kibah')
      .update({ [BASE_KIBAH_LINK_DRIVE_DESARROLLO]: link })
      .ilike('Nombre Kibah', escapeIlike(nombre))
    if (error) throw new Error(error.message)
  }
}

// ── Unidades ──────────────────────────────────────────────────────────

export interface ColumnasExtraUnidad {
  nivel: string | null
  orientacion: string | null
  m2_bodega: string | null
  precio_eng_10: string | null
  precio_eng_25: string | null
  precio_eng_50: string | null
  precio_eng_75: string | null
  link_drive_desarrollo: string | null
  link_drive_unidad: string | null
}

/** Columnas de base_kibah que propiedades_view no trae (agregadas en sql/007–009): DB → campo. */
const COLUMNAS_EXTRA: Record<string, keyof ColumnasExtraUnidad> = {
  [BASE_KIBAH_NIVEL]: 'nivel',
  [BASE_KIBAH_ORIENTACION]: 'orientacion',
  [BASE_KIBAH_M2_BODEGA]: 'm2_bodega',
  ...Object.fromEntries(
    ENGANCHE_OPTIONS.map((e) => [`${BASE_KIBAH_PRECIO_ENG_PREFIX}${e}%`, `precio_eng_${e}` as keyof ColumnasExtraUnidad])
  ),
  [BASE_KIBAH_LINK_DRIVE_DESARROLLO]: 'link_drive_desarrollo',
  [BASE_KIBAH_LINK_DRIVE_UNIDAD]: 'link_drive_unidad',
}

const SIN_EXTRA = Object.fromEntries(Object.values(COLUMNAS_EXTRA).map((k) => [k, null])) as unknown as ColumnasExtraUnidad

/**
 * Agrega a unidades leídas de propiedades_view las columnas nuevas (nivel, orientación, m² bodega,
 * precios por enganche, links de Drive) con una sola consulta, y deja link_drive como el link
 * efectivo: el propio de la unidad, si no el del desarrollo, si no el "Link Drive" viejo.
 */
export async function withColumnasExtraUnidades<T extends { id: number; link_drive?: string | null }>(
  rows: T[]
): Promise<(T & ColumnasExtraUnidad & { link_drive: string | null })[]> {
  if (rows.length === 0) return []
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('base_kibah')
    .select(['id', ...Object.keys(COLUMNAS_EXTRA).map((c) => `"${c}"`)].join(', '))
    .in('id', rows.map((r) => r.id))
  if (error) console.error('Error leyendo columnas extra de unidades:', error.message)

  const map = new Map<number, ColumnasExtraUnidad>()
  for (const r of (data ?? []) as unknown as Record<string, unknown>[]) {
    const extra = { ...SIN_EXTRA }
    for (const [col, campo] of Object.entries(COLUMNAS_EXTRA)) extra[campo] = text(r[col])
    map.set(r.id as number, extra)
  }

  return rows.map((r) => {
    const extra = map.get(r.id) ?? SIN_EXTRA
    const legacy = text(r.link_drive)
    const legacyEsLink = legacy && /^https?:\/\//i.test(legacy) ? legacy : null
    return { ...r, ...extra, link_drive: extra.link_drive_unidad ?? extra.link_drive_desarrollo ?? legacyEsLink }
  })
}

/**
 * Links propios que tenían las unidades de un desarrollo antes de borrarlas (respaldo de sql/009),
 * por número de unidad en minúsculas. Solo los que difieren del Drive actual del desarrollo.
 * Si el respaldo no existe, devuelve vacío.
 */
export async function getLinksPropiosRespaldo(nombreKibah: string, linkDesarrollo: string | null): Promise<Record<string, string>> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from(RESPALDO_LINKS_DRIVE_TABLE)
    .select('"Unidad", link_drive')
    .ilike('Nombre Kibah', escapeIlike(nombreKibah.trim()))
    .limit(1000)
  if (error) {
    console.error('Respaldo de links no disponible:', error.message)
    return {}
  }
  const out: Record<string, string> = {}
  for (const r of (data ?? []) as { Unidad: string | null; link_drive: string | null }[]) {
    const unidad = r.Unidad?.trim().toLowerCase()
    const link = text(r.link_drive)
    if (unidad && link && !sameLink(link, linkDesarrollo)) out[unidad] = link
  }
  return out
}
