import { createAdminClient } from '@/lib/supabase/admin'
import { escapeIlike } from '@/lib/utils/ilike'
import {
  BASE_KIBAH_LINK_DRIVE_DESARROLLO,
  BASE_KIBAH_LINK_DRIVE_UNIDAD,
  DESARROLLO_LINK_DRIVE,
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

/**
 * Agrega link_drive_desarrollo y link_drive_unidad a unidades leídas de propiedades_view,
 * y deja link_drive como el link efectivo: el propio de la unidad, si no el del desarrollo,
 * si no el "Link Drive" viejo.
 */
export async function withLinksDriveUnidades<T extends { id: number; link_drive?: string | null }>(
  rows: T[]
): Promise<(T & { link_drive: string | null; link_drive_desarrollo: string | null; link_drive_unidad: string | null })[]> {
  if (rows.length === 0) return []
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('base_kibah')
    .select(`id, "${BASE_KIBAH_LINK_DRIVE_DESARROLLO}", "${BASE_KIBAH_LINK_DRIVE_UNIDAD}"`)
    .in('id', rows.map((r) => r.id))
  if (error) console.error('Error leyendo links de Drive de unidades:', error.message)
  const map = new Map((data ?? []).map((r) => {
    const row = r as Record<string, unknown>
    return [row.id as number, { des: text(row[BASE_KIBAH_LINK_DRIVE_DESARROLLO]), uni: text(row[BASE_KIBAH_LINK_DRIVE_UNIDAD]) }]
  }))
  return rows.map((r) => {
    const l = map.get(r.id)
    const legacy = text(r.link_drive)
    const legacyEsLink = legacy && /^https?:\/\//i.test(legacy) ? legacy : null
    return {
      ...r,
      link_drive_desarrollo: l?.des ?? null,
      link_drive_unidad: l?.uni ?? null,
      link_drive: l?.uni ?? l?.des ?? legacyEsLink,
    }
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
