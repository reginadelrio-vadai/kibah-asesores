import type { ENGANCHE_OPTIONS } from '@/lib/utils/constants'

export type EngancheOption = (typeof ENGANCHE_OPTIONS)[number]

/** Precios por esquema de enganche (10/25/50/75%). */
export type PreciosEnganche = Record<EngancheOption, number | null>

/** Una unidad tal como Claude la leyó del PDF. */
export interface UnidadPdf {
  unidad: string
  nivel: string | null
  orientacion: string | null
  recamaras: number | null
  banos: number | null
  m2_interior: number | null
  m2_balcon: number | null
  m2_patio: number | null
  m2_total: number | null
  /** Texto de la columna bodega tal cual (ej. "Sí", "1", "B-12", "—"). */
  bodega: string | null
  /** Tamaño de la bodega en m² si el PDF lo trae. */
  bodega_m2: number | null
  precios: PreciosEnganche
  /** Estado si el PDF lo marca (vendido, apartado, disponible…). */
  estado: string | null
  nota: string | null
}

/** Resultado de leer el PDF. */
export interface LecturaPdf {
  /** Nombre del desarrollo/torre que aparece en el PDF (ej. "SEVILLA 1"). */
  titulo: string | null
  /** Encabezados de la tabla tal como aparecen en el PDF. */
  columnas_detectadas: string[]
  unidades: UnidadPdf[]
  /** Dudas o cosas que Claude no pudo leer bien. */
  observaciones: string | null
}

/** Unidad ya existente en el desarrollo (para marcar "Actualizar"). */
export interface UnidadExistente {
  id: number
  unidad: string
  /** "Nombre Desarrollador" de la unidad (la torre). */
  torre: string | null
  disponibilidad: string | null
}

/** Respuesta de POST /api/desarrollos/[id]/unidades/pdf */
export interface LecturaPdfResponse {
  lectura: LecturaPdf
  existentes: UnidadExistente[]
}

/** Respuesta de POST /api/desarrollos/[id]/unidades/importar */
export interface ImportarUnidadesResponse {
  insertadas: number
  actualizadas: number
}
