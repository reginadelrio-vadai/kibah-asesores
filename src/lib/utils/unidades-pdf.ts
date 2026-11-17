import { BODEGA_OPTIONS, DISPONIBILIDAD_OPTIONS, ENGANCHE_OPTIONS, TORRE_SIN_NOMBRE } from '@/lib/utils/constants'
import type { EngancheOption, LecturaPdfResponse, PreciosEnganche, UnidadExistente } from '@/types/unidades-pdf'

export type Bodega = (typeof BODEGA_OPTIONS)[number]
export type Disponibilidad = (typeof DISPONIBILIDAD_OPTIONS)[number]

const BODEGA_SI_VALUE = BODEGA_OPTIONS[0]
const BODEGA_NO_VALUE = BODEGA_OPTIONS[1]

/** Una fila en la pantalla de revisión (editable). */
export interface FilaRevision {
  key: string
  incluir: boolean
  unidad: string
  nivel: string | null
  orientacion: string | null
  recamaras: number | null
  banos: number | null
  m2_interior: number | null
  m2_balcon: number | null
  m2_patio: number | null
  m2_total: number | null
  /** Texto original de la columna bodega en el PDF. */
  bodegaPdf: string | null
  bodega: Bodega | null
  bodega_m2: number | null
  precios: PreciosEnganche
  disponibilidad: Disponibilidad
  /** Estado tal como lo marca el PDF. */
  estadoPdf: string | null
  nota: string | null
}

// ── Comparación con las unidades que ya existen ───────────────────────

/** Resultado de buscar una unidad del PDF entre las existentes del desarrollo. */
export interface Coincidencia {
  /** La unidad que se actualizará; null = se crea nueva. */
  existente: UnidadExistente | null
  /** Más de una unidad existente coincide: no se puede saber cuál actualizar. */
  ambigua: boolean
  /** Torres donde ya existe ese número de unidad pero que no coinciden con la torre elegida. */
  otrasTorres: string[]
}

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase()

/**
 * Empareja por número de unidad + torre ("Nombre Desarrollador"), sin distinguir mayúsculas.
 * - Con torre: coincide la de la misma torre. Una unidad vieja sin torre también cuenta si es la única con ese número.
 * - Sin torre: coincide solo si hay exactamente una unidad con ese número.
 */
export function buscarExistente(existentes: UnidadExistente[], unidad: string, torre: string | null): Coincidencia {
  const candidatas = existentes.filter((e) => norm(e.unidad) === norm(unidad))
  if (candidatas.length === 0) return { existente: null, ambigua: false, otrasTorres: [] }

  const t = norm(torre)
  const resultado = (matches: UnidadExistente[]): Coincidencia => ({
    existente: matches.length === 1 ? matches[0] : null,
    ambigua: matches.length > 1,
    otrasTorres: candidatas.filter((c) => !matches.includes(c)).map((c) => c.torre?.trim() || TORRE_SIN_NOMBRE),
  })

  if (!t) return resultado(candidatas)
  const mismaTorre = candidatas.filter((c) => norm(c.torre) === t)
  if (mismaTorre.length > 0) return resultado(mismaTorre)
  if (candidatas.length === 1 && !norm(candidatas[0].torre)) return resultado(candidatas)
  return resultado([])
}

// ── Lectura del PDF → filas editables ─────────────────────────────────

const BODEGA_NO = /^(no|n|✗|✘|×|-+|—|–|n\/?a|sin(\s+bodega)?|ninguna|no aplica)$/i
const BODEGA_SI = /^(s[ií]|s|yes|✓|✔|☑|incluida|incluye)$/i

function numeroEn(v: string): number | null {
  const n = Number(v.replace(/m2|m²|,|\s/gi, ''))
  return v.trim() !== '' && !isNaN(n) ? n : null
}

/**
 * Sugerencia de bodega a partir del PDF (el usuario la corrige en la revisión).
 * Un número es el tamaño en m²: mayor a 0 = Si con ese tamaño, 0 = No. Claves como "B-12" = Si sin tamaño.
 */
function bodegaFromPdf(raw: string | null, m2Leido: number | null): { bodega: Bodega | null; m2: number | null } {
  if (m2Leido !== null && m2Leido > 0) return { bodega: BODEGA_SI_VALUE, m2: m2Leido }
  const v = raw?.trim()
  if (!v) return { bodega: null, m2: null }
  if (BODEGA_NO.test(v)) return { bodega: BODEGA_NO_VALUE, m2: null }
  if (BODEGA_SI.test(v)) return { bodega: BODEGA_SI_VALUE, m2: null }
  const n = numeroEn(v)
  if (n !== null) return n > 0 ? { bodega: BODEGA_SI_VALUE, m2: n } : { bodega: BODEGA_NO_VALUE, m2: null }
  if (/^[a-z]{0,3}[\s-]?\d+[a-z]?$/i.test(v)) return { bodega: BODEGA_SI_VALUE, m2: null }
  return { bodega: null, m2: null }
}

/** Al editar la bodega en la revisión: un tamaño > 0 implica "Si"; "No" borra el tamaño. */
export function patchBodega(cambio: { bodega?: Bodega | null; bodega_m2?: number | null }): Partial<FilaRevision> {
  if ('bodega_m2' in cambio) {
    const m2 = cambio.bodega_m2 ?? null
    return m2 !== null && m2 > 0 ? { bodega_m2: m2, bodega: BODEGA_SI_VALUE } : { bodega_m2: m2 }
  }
  return cambio.bodega === BODEGA_NO_VALUE ? { bodega: BODEGA_NO_VALUE, bodega_m2: null } : { bodega: cambio.bodega ?? null }
}

function matchDisponibilidad(value: string | null): Disponibilidad | null {
  const v = value?.trim().toLowerCase()
  if (!v) return null
  return DISPONIBILIDAD_OPTIONS.find((o) => v.startsWith(o.toLowerCase().slice(0, 5))) ?? null
}

export function esVendida(estado: string | null): boolean {
  return !!estado && /vendid/i.test(estado)
}

/** Convierte lo que leyó Claude en filas editables. La torre inicial sirve para heredar la disponibilidad existente. */
export function toFilasRevision(res: LecturaPdfResponse, torre: string | null): FilaRevision[] {
  return res.lectura.unidades.map((u, i) => {
    const unidad = u.unidad.trim()
    const { existente } = buscarExistente(res.existentes, unidad, torre)
    const bodega = bodegaFromPdf(u.bodega, u.bodega_m2)
    return {
      key: `${i}-${unidad}`,
      // Las vendidas no tienen estado equivalente en el CRM: se dejan fuera por default.
      incluir: !esVendida(u.estado),
      unidad,
      nivel: u.nivel,
      orientacion: u.orientacion,
      recamaras: u.recamaras,
      banos: u.banos,
      m2_interior: u.m2_interior,
      m2_balcon: u.m2_balcon,
      m2_patio: u.m2_patio,
      m2_total: u.m2_total,
      bodegaPdf: u.bodega,
      bodega: bodega.bodega,
      bodega_m2: bodega.m2,
      precios: u.precios,
      disponibilidad:
        matchDisponibilidad(u.estado) ?? matchDisponibilidad(existente?.disponibilidad ?? null) ?? DISPONIBILIDAD_OPTIONS[0],
      estadoPdf: u.estado,
      nota: u.nota,
    }
  })
}

/** Qué esquema de enganche proponer como precio principal: el default si el PDF lo trae, si no el primero que tenga precios. */
export function precioPrincipalSugerido(filas: FilaRevision[], preferido: EngancheOption): EngancheOption {
  const tiene = (e: EngancheOption) => filas.some((f) => (f.precios[e] ?? 0) > 0)
  if (tiene(preferido)) return preferido
  return ENGANCHE_OPTIONS.find(tiene) ?? preferido
}

/** Problemas que impiden guardar una fila incluida. */
export function erroresFila(f: FilaRevision, precioPrincipal: EngancheOption, repetidas: Set<string>, c: Coincidencia | undefined): string[] {
  const errores: string[] = []
  if (!f.unidad.trim()) errores.push('Falta el número de unidad')
  const precio = f.precios[precioPrincipal]
  if (precio === null || precio <= 0) errores.push(`Falta precio con enganche ${precioPrincipal}%`)
  if (repetidas.has(norm(f.unidad))) errores.push('Unidad repetida en el PDF')
  if (c?.ambigua) errores.push('Hay varias unidades con este número; escribe la torre arriba para saber cuál actualizar')
  return errores
}

/** Números de unidad que aparecen más de una vez entre las filas incluidas. */
export function unidadesRepetidas(filas: FilaRevision[]): Set<string> {
  const vistas = new Set<string>()
  const repetidas = new Set<string>()
  for (const f of filas) {
    if (!f.incluir) continue
    const k = norm(f.unidad)
    if (vistas.has(k)) repetidas.add(k)
    vistas.add(k)
  }
  return repetidas
}

/** Cuerpo de POST /api/desarrollos/[id]/unidades/importar */
export function toImportPayload(filas: FilaRevision[], precioPrincipal: EngancheOption, torre: string) {
  return {
    precio_principal: precioPrincipal,
    torre: torre.trim() || null,
    unidades: filas
      .filter((f) => f.incluir)
      .map((f) => ({
        unidad: f.unidad.trim(),
        nivel: f.nivel?.trim() || null,
        orientacion: f.orientacion?.trim() || null,
        recamaras: f.recamaras,
        banos: f.banos,
        m2_interior: f.m2_interior,
        m2_balcon: f.m2_balcon,
        m2_patio: f.m2_patio,
        m2_total: f.m2_total,
        bodega: f.bodega,
        bodega_m2: f.bodega_m2,
        precios: f.precios,
        disponibilidad: f.disponibilidad,
      })),
  }
}
