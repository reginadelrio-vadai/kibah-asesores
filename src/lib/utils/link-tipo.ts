/** Identifica de dónde es un link para que el encargado vea si es Drive, Cloudinary o Maps. */

export type LinkTipo = 'Drive' | 'Cloudinary' | 'Maps' | 'Otro'

export const LINK_TIPO_STYLES: Record<LinkTipo, string> = {
  Drive: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  Cloudinary: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  Maps: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  Otro: 'bg-bg-tertiary text-text-secondary',
}

/** Si el valor es un código <iframe src="...">, devuelve la URL del src; si no, el valor tal cual. */
export function urlDeLink(value: string): string {
  const src = value.match(/src=["']([^"']+)["']/i)
  return (src ? src[1] : value).trim()
}

export function tipoDeLink(value: string | null | undefined): LinkTipo | null {
  if (!value?.trim()) return null
  let host = ''
  try {
    host = new URL(urlDeLink(value)).host.toLowerCase()
  } catch {
    return 'Otro'
  }
  const url = urlDeLink(value).toLowerCase()
  if (host.includes('cloudinary.com')) return 'Cloudinary'
  if (host === 'drive.google.com' || host === 'docs.google.com') return 'Drive'
  if (url.includes('google.com/maps') || host.startsWith('maps.') || host === 'goo.gl') return 'Maps'
  return 'Otro'
}

export interface OpcionLink {
  /** Columna de donde viene (ej. "Link Imagen"). */
  campo: string
  value: string
  tipo: LinkTipo
}

/** Links distintos que tiene un desarrollo, para escoger cuál heredan sus unidades. */
export function opcionesLinkDesarrollo(d: {
  link_drive?: string | null
  imagen_principal: string | null
  imagen_1: string | null
  imagen_2: string | null
  imagen_3: string | null
  link_maps: string | null
}): OpcionLink[] {
  const campos: [string, string | null | undefined][] = [
    ['Link Drive', d.link_drive],
    ['Link Imagen', d.imagen_principal],
    ['Imagen 1', d.imagen_1],
    ['Imagen 2', d.imagen_2],
    ['Imagen 3', d.imagen_3],
    ['Link Maps', d.link_maps],
  ]
  const vistos = new Set<string>()
  const out: OpcionLink[] = []
  for (const [campo, raw] of campos) {
    if (!raw?.trim() || raw.trim().length < 2) continue
    const value = urlDeLink(raw)
    if (vistos.has(value)) continue
    vistos.add(value)
    out.push({ campo, value, tipo: tipoDeLink(value) ?? 'Otro' })
  }
  return out
}
